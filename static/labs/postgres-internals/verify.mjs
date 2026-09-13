import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createInterface} from 'node:readline';

const container = process.argv[2] ?? 'pg-internals-lab';

function session() {
  const child = spawn('docker', ['exec', '-i', container, 'psql', '-X', '-qAt', '-U', 'postgres']);
  let pending;
  let sequence = 0;
  let errors = '';
  const lines = createInterface({input: child.stdout});
  const fail = error => {
    if (!pending) return;
    clearTimeout(pending.timer);
    pending.reject(error);
    pending = undefined;
  };
  child.stderr.on('data', chunk => { errors += chunk; });
  child.on('error', fail);
  child.on('exit', code => fail(new Error(`psql exited ${code}: ${errors}`)));
  lines.on('line', line => {
    if (!pending) return;
    if (line === pending.marker) {
      const finished = pending;
      pending = undefined;
      clearTimeout(finished.timer);
      finished.resolve({code: finished.rows.pop(), rows: finished.rows});
    } else pending.rows.push(line);
  });
  return {
    query(sql) {
      assert.equal(pending, undefined, 'One query at a time per connection');
      return new Promise((resolve, reject) => {
        const marker = `course_check_${++sequence}`;
        const timer = setTimeout(() => {
          fail(new Error(`Timed out: ${sql}\n${errors}`));
          child.kill();
        }, 10000);
        pending = {marker, rows: [], resolve, reject, timer};
        child.stdin.write(`${sql}\n\\echo :SQLSTATE\n\\echo ${marker}\n`);
      });
    },
    close() { child.stdin.end('ROLLBACK;\n\\q\n'); },
  };
}

const reader = session();
const writer = session();
async function run(connection, sql, expectedCode = '00000') {
  const result = await connection.query(sql);
  assert.equal(result.code, expectedCode, sql);
  return result.rows;
}
async function reset() {
  await run(reader, 'ROLLBACK;');
  await run(writer, 'ROLLBACK;');
  await run(reader, 'UPDATE course_lab.products SET stock=10 WHERE id=1;');
  await run(reader, 'UPDATE course_lab.on_call SET available=true;');
}

try {
  for (const [level, expected] of [['REPEATABLE READ', '10'], ['READ COMMITTED', '9']]) {
    await reset();
    await run(reader, `BEGIN ISOLATION LEVEL ${level};`);
    assert.deepEqual(await run(reader, 'SELECT stock FROM course_lab.products WHERE id=1;'), ['10']);
    await run(writer, 'BEGIN;');
    await run(writer, 'UPDATE course_lab.products SET stock=9 WHERE id=1;');
    assert.deepEqual(await run(reader, 'SELECT stock FROM course_lab.products WHERE id=1;'), ['10']);
    await run(writer, 'COMMIT;');
    assert.deepEqual(await run(reader, 'SELECT stock FROM course_lab.products WHERE id=1;'), [expected]);
    await run(reader, 'COMMIT;');
    assert.deepEqual(await run(reader, 'SELECT stock FROM course_lab.products WHERE id=1;'), ['9']);
    console.log(`${level}: snapshot visibility PASS`);
  }
  for (const level of ['REPEATABLE READ', 'SERIALIZABLE']) {
    await reset();
    for (const connection of [reader, writer]) {
      await run(connection, `BEGIN ISOLATION LEVEL ${level};`);
      assert.deepEqual(await run(connection, 'SELECT count(*) FROM course_lab.on_call WHERE available;'), ['2']);
    }
    await run(reader, "UPDATE course_lab.on_call SET available=false WHERE name='alice';");
    await run(reader, 'COMMIT;');
    await run(writer, "UPDATE course_lab.on_call SET available=false WHERE name='bob';", level === 'SERIALIZABLE' ? '40001' : '00000');
    await run(writer, level === 'SERIALIZABLE' ? 'ROLLBACK;' : 'COMMIT;');
    assert.deepEqual(await run(reader, 'SELECT count(*) FROM course_lab.on_call WHERE available;'), [level === 'SERIALIZABLE' ? '1' : '0']);
    console.log(`${level}: write skew schedule PASS`);
  }
  await reset();
  await run(reader, 'BEGIN ISOLATION LEVEL REPEATABLE READ;');
  await run(reader, 'SELECT stock FROM course_lab.products WHERE id=1;');
  await run(writer, 'UPDATE course_lab.products SET stock=9 WHERE id=1;');
  await run(reader, 'UPDATE course_lab.products SET stock=stock-1 WHERE id=1;', '40001');
  console.log('Repeatable Read concurrent update PASS');
  await reset();
  await run(reader, 'BEGIN;');
  await run(reader, 'SELECT id FROM course_lab.products WHERE id=1 FOR UPDATE;');
  assert.deepEqual(await run(writer, "SELECT stock, xmax <> '0'::xid FROM course_lab.products WHERE id=1;"), ['10|t']);
  await run(writer, 'BEGIN;');
  await run(writer, "SET LOCAL lock_timeout='100ms';");
  await run(writer, 'UPDATE course_lab.products SET stock=stock+1 WHERE id=1;', '55P03');
  console.log('Lock-only xmax remains visible; writer lock timeout PASS');
  await reset();
  await run(reader, 'UPDATE course_lab.products SET stock=-1 WHERE id=1;', '23514');
  await run(reader, 'UPDATE course_lab.products SET price=NULL WHERE id=1;', '23502');
  await run(writer, 'BEGIN;');
  await run(writer, 'DELETE FROM course_lab.products WHERE id=1;');
  assert.deepEqual(await run(reader, 'SELECT stock FROM course_lab.products WHERE id=1;'), ['10']);
  await run(writer, 'ROLLBACK;');
  assert.deepEqual(await run(reader, 'SELECT stock FROM course_lab.products WHERE id=1;'), ['10']);
  console.log('Constraints and aborted deletion PASS');
  await run(reader, 'BEGIN;');
  await run(writer, 'BEGIN;');
  await run(reader, 'SELECT id FROM course_lab.products WHERE id=1 FOR UPDATE;');
  await run(writer, 'SELECT id FROM course_lab.products WHERE id=2 FOR UPDATE;');
  const conflicts = await Promise.all([
    reader.query('SELECT id FROM course_lab.products WHERE id=2 FOR UPDATE;'),
    writer.query('SELECT id FROM course_lab.products WHERE id=1 FOR UPDATE;'),
  ]);
  assert.deepEqual(conflicts.map(result => result.code).sort(), ['00000', '40P01']);
  console.log('Deadlock victim detection PASS');
  await reset();
} finally {
  reader.close();
  writer.close();
}