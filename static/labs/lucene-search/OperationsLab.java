import java.nio.file.Files;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import org.apache.lucene.analysis.standard.StandardAnalyzer;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.document.IntPoint;
import org.apache.lucene.document.StringField;
import org.apache.lucene.document.TextField;
import org.apache.lucene.index.DirectoryReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.KeepOnlyLastCommitDeletionPolicy;
import org.apache.lucene.index.SnapshotDeletionPolicy;
import org.apache.lucene.index.Term;
import org.apache.lucene.search.BooleanClause;
import org.apache.lucene.search.BooleanQuery;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.LRUQueryCache;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.QueryCachingPolicy;
import org.apache.lucene.search.SearcherManager;
import org.apache.lucene.search.TermQuery;
import org.apache.lucene.search.TopScoreDocCollectorManager;
import org.apache.lucene.store.ByteBuffersDirectory;
import org.apache.lucene.store.FSDirectory;
import org.apache.lucene.store.IOContext;

public class OperationsLab {
  static Document article(String id, String body) {
    Document document = new Document();
    document.add(new StringField("id", id, Field.Store.YES));
    document.add(new TextField("body", body, Field.Store.YES));
    return document;
  }

  static void check(boolean condition, String message) {
    if (!condition) throw new IllegalStateException(message);
  }

  static void recovery() throws Exception {
    var root = Files.createTempDirectory("lucene-recovery-");
    var policy = new SnapshotDeletionPolicy(new KeepOnlyLastCommitDeletionPolicy());
    var config = new IndexWriterConfig(new StandardAnalyzer()).setIndexDeletionPolicy(policy);
    try (var directory = FSDirectory.open(root.resolve("live"));
         var backup = FSDirectory.open(root.resolve("backup"));
         var writer = new IndexWriter(directory, config)) {
      writer.updateDocument(new Term("id", "A"), article("A", "original bicycle"));
      writer.commit();
      var snapshot = policy.snapshot();
      try (var manager = new SearcherManager(writer, null)) {
        var oldSearcher = manager.acquire();
        try {
          writer.updateDocument(new Term("id", "A"), article("A", "updated bicycle"));
          manager.maybeRefreshBlocking();
          var freshSearcher = manager.acquire();
          try {
            Query updated = new TermQuery(new Term("body", "updated"));
            int oldCount = oldSearcher.count(updated);
            int newCount = freshSearcher.count(updated);
            check(oldCount == 0 && newCount == 1, "Refresh contract failed");
            System.out.println("heldReader=" + oldCount + " refreshedReader=" + newCount);
          } finally { manager.release(freshSearcher); }
        } finally { manager.release(oldSearcher); }
        try (var committed = DirectoryReader.open(directory)) {
          check(new IndexSearcher(committed).count(new TermQuery(new Term("body", "updated"))) == 0,
              "Uncommitted update appeared in committed reader");
        }
        writer.commit();
        for (String file : snapshot.getFileNames()) backup.copyFrom(directory, file, file, IOContext.DEFAULT);
        backup.sync(snapshot.getFileNames());
        backup.syncMetaData();
      } finally { policy.release(snapshot); }
    }
    try (var live = FSDirectory.open(root.resolve("live"));
         var backup = FSDirectory.open(root.resolve("backup"));
         var liveReader = DirectoryReader.open(live);
         var restored = DirectoryReader.open(backup)) {
      int current = new IndexSearcher(liveReader).count(new TermQuery(new Term("body", "updated")));
      int original = new IndexSearcher(restored).count(new TermQuery(new Term("body", "original")));
      check(current == 1 && original == 1, "Reopen or restore failed");
      System.out.println("reopenedUpdated=" + current + " restoredOriginal=" + original);
      System.out.println("Inspect disposable index and backup at " + root);
    }
  }

  static void performance() throws Exception {
    try (var directory = new ByteBuffersDirectory();
         var writer = new IndexWriter(directory, new IndexWriterConfig(new StandardAnalyzer()))) {
      for (int index = 0; index < 20000; index++) {
        Document document = article("doc-" + index, "bicycle repair");
        document.add(new IntPoint("bucket", index % 10));
        writer.addDocument(document);
      }
      try (var reader = DirectoryReader.open(writer)) {
        var searcher = new IndexSearcher(reader);
        Query text = new TermQuery(new Term("body", "bicycle"));
        var limited = searcher.search(text, new TopScoreDocCollectorManager(10, 10));
        var exact = searcher.search(text, new TopScoreDocCollectorManager(10, Integer.MAX_VALUE));
        check(exact.totalHits.value() == 20000, "Exact count failed");
        System.out.println("bounded=" + limited.totalHits + " exact=" + exact.totalHits);
        var cache = new LRUQueryCache(32, 8 * 1024 * 1024, context -> true, Float.POSITIVE_INFINITY);
        searcher.setQueryCache(cache);
        searcher.setQueryCachingPolicy(new QueryCachingPolicy() {
          @Override public void onUse(Query query) {}
          @Override public boolean shouldCache(Query query) { return true; }
        });
        Query filtered = new BooleanQuery.Builder().add(text, BooleanClause.Occur.MUST)
            .add(IntPoint.newRangeQuery("bucket", 0, 4), BooleanClause.Occur.FILTER).build();
        for (int iteration = 0; iteration < 4; iteration++) searcher.search(filtered, 10);
        check(cache.getHitCount() > 0, "Expected repeated filter cache hits");
        System.out.println("cacheHits=" + cache.getHitCount() + " misses=" + cache.getMissCount() + " cacheBytes=" + cache.ramBytesUsed());
        try (var executor = Executors.newFixedThreadPool(2)) {
          Callable<Integer> request = () -> searcher.count(filtered);
          for (var result : executor.invokeAll(List.of(request, request, request, request))) {
            check(result.get() == 10000, "Concurrent count mismatch");
          }
        }
        var timedSearcher = new IndexSearcher(reader);
        timedSearcher.setTimeout(() -> true);
        var partial = timedSearcher.search(text, 10);
        check(timedSearcher.timedOut(), "Expected cooperative timeout");
        System.out.println("concurrentCounts=10000 timedOut=" + timedSearcher.timedOut() + " partialHits=" + partial.scoreDocs.length);
      }
    }
  }

  public static void main(String[] args) throws Exception {
    if (args.length > 0 && args[0].equals("performance")) performance();
    else recovery();
  }
}