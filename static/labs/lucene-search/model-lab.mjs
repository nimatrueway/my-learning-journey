import {readFile, writeFile} from 'node:fs/promises';
import {AutoTokenizer, AutoModelForSequenceClassification, pipeline} from '@huggingface/transformers';

const embeddingModel = 'Xenova/all-MiniLM-L6-v2';
const embeddingRevision = '751bff37182d3f1213fa05d7196b954e230abad9';
const rerankingModel = 'Xenova/ms-marco-MiniLM-L-6-v2';
const rerankingRevision = 'a09144355adeed5f58c8ed011d209bf8ee5a1fec';
const mode = process.argv[2] ?? 'embed';

if (mode === 'embed') {
  const query = process.argv.slice(3).join(' ') || 'How do I mend a punctured bicycle tube?';
  const tokenizer = await AutoTokenizer.from_pretrained(embeddingModel, {revision: embeddingRevision});
  const extractor = await pipeline('feature-extraction', embeddingModel, {revision: embeddingRevision, dtype: 'q8'});
  const sources = [
    {id: 'repair', access: 'public', text: 'To mend a punctured bicycle inner tube, remove the wheel and find the hole. Roughen the rubber, apply patch adhesive, wait until tacky, and press on a patch. Check the tire for sharp debris before reinstalling and inflating the tube.'},
    {id: 'rental', access: 'public', text: 'Bicycle rental shops offer daily and weekly rates. Bring identification and check the opening hours before returning a rented bicycle.'},
    {id: 'database', access: 'public', text: 'A database index accelerates record lookup. Back up committed files and test restoration before relying on a recovery plan.'},
    {id: 'private-repair', access: 'private', text: 'Confidential bicycle repair instructions for a punctured inner tube. Internal staff contact details must not appear in public results.'},
  ];
  const chunks = [];
  for (const source of sources) {
    const tokens = tokenizer.encode(source.text, {add_special_tokens: false});
    for (let start = 0; start < tokens.length; start += 80) {
      const end = Math.min(start + 96, tokens.length);
      const text = tokenizer.decode(tokens.slice(start, end), {skip_special_tokens: true});
      if (tokenizer.encode(text).length > 128) throw new Error('Decoded chunk exceeds model budget');
      const output = await extractor(text, {pooling: 'mean', normalize: true, truncation: true, max_length: 128});
      chunks.push({id: `${source.id}:${start}-${end}`, parentId: source.id, text, access: source.access, vector: output.tolist()[0]});
      if (end === tokens.length) break;
    }
  }
  if (tokenizer.encode(query).length > 128) throw new Error('Query exceeds lab token budget');
  const queryVector = (await extractor(query, {pooling: 'mean', normalize: true, truncation: true, max_length: 128})).tolist()[0];
  await writeFile('embeddings.json', JSON.stringify({model: embeddingModel, revision: embeddingRevision, query, queryVector, chunks}, null, 2));
  console.log(`Wrote ${chunks.length} chunks, dimensions=${queryVector.length}, to embeddings.json`);
} else if (mode === 'rerank') {
  const input = JSON.parse(await readFile('candidates.json', 'utf8'));
  if (!Array.isArray(input.candidates) || input.candidates.length === 0 || input.candidates.length > 10) {
    throw new Error('Expected 1-10 already-authorized Lucene candidates');
  }
  const tokenizer = await AutoTokenizer.from_pretrained(rerankingModel, {revision: rerankingRevision});
  const model = await AutoModelForSequenceClassification.from_pretrained(rerankingModel, {revision: rerankingRevision, dtype: 'q8'});
  const features = tokenizer(input.candidates.map(() => input.query), {
    text_pair: input.candidates.map(candidate => candidate.text), padding: true, truncation: true, max_length: 256,
  });
  const output = await model(features);
  const ranked = input.candidates.map((candidate, index) => ({...candidate, rerankScore: Number(output.logits.data[index])}));
  ranked.sort((left, right) => right.rerankScore - left.rerankScore || left.id.localeCompare(right.id));
  const seenParents = new Set();
  const parents = ranked.filter(candidate => {
    if (seenParents.has(candidate.parentId)) return false;
    seenParents.add(candidate.parentId);
    return true;
  });
  console.table(parents.map(({id, score, rerankScore}) => ({id, vectorScore: score, rerankScore})));
  await writeFile('reranked.json', JSON.stringify({query: input.query, model: rerankingModel, revision: rerankingRevision, parents}, null, 2));
} else {
  throw new Error('Use embed or rerank');
}