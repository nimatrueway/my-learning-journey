import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.apache.lucene.analysis.standard.StandardAnalyzer;
import org.apache.lucene.analysis.tokenattributes.CharTermAttribute;
import org.apache.lucene.analysis.tokenattributes.PositionIncrementAttribute;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.document.KnnFloatVectorField;
import org.apache.lucene.document.StringField;
import org.apache.lucene.document.TextField;
import org.apache.lucene.index.DirectoryReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.Term;
import org.apache.lucene.index.VectorSimilarityFunction;
import org.apache.lucene.queryparser.classic.QueryParser;
import org.apache.lucene.search.BooleanClause;
import org.apache.lucene.search.BooleanQuery;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.KnnFloatVectorQuery;
import org.apache.lucene.search.PhraseQuery;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.TermQuery;
import org.apache.lucene.search.TopDocs;
import org.apache.lucene.store.ByteBuffersDirectory;

public class SearchLab {
    record Article(String id, String body, String access, float[] vector) {}

    static final List<Article> ARTICLES = List.of(
        new Article("A", "Bicycle repair tools", "public", new float[]{0.8f, 0.6f}),
        new Article("B", "Fix a flat wheel", "public", new float[]{1.0f, 0.0f}),
        new Article("C", "Bicycle repair private manual", "private", new float[]{0.99f, 0.01f}),
        new Article("D", "Database index guide", "public", new float[]{0.0f, 1.0f}),
        new Article("E", "Bicycle tire repair", "public", new float[]{0.9f, 0.1f})
    );

    public static void main(String[] args) throws Exception {
        String mode = args.length > 0 ? args[0] : "lexical";
        String text = args.length > 1 ? args[1] : "bicycle repair";
        if (!List.of("lexical", "phrase", "vector", "hybrid", "analyze", "refresh").contains(mode)) {
            throw new IllegalArgumentException("Modes: lexical, phrase, vector, hybrid, analyze, refresh");
        }
        try (var analyzer = new StandardAnalyzer();
             var directory = new ByteBuffersDirectory();
             var writer = new IndexWriter(directory, new IndexWriterConfig(analyzer))) {
            if (mode.equals("analyze")) {
                try (var tokens = analyzer.tokenStream("body", text)) {
                    var term = tokens.addAttribute(CharTermAttribute.class);
                    var increment = tokens.addAttribute(PositionIncrementAttribute.class);
                    tokens.reset();
                    int position = -1;
                    while (tokens.incrementToken()) {
                        position += increment.getPositionIncrement();
                        System.out.println(position + ": " + term);
                    }
                    tokens.end();
                }
                return;
            }
            for (Article article : ARTICLES) {
                writer.addDocument(document(article));
            }
            try (var reader = DirectoryReader.open(writer)) {
                var searcher = new IndexSearcher(reader);
                Query allowed = new TermQuery(new Term("access", "public"));
                Query lexical = new BooleanQuery.Builder()
                    .add(mode.equals("phrase") ? new PhraseQuery("body", "bicycle", "repair")
                        : new QueryParser("body", analyzer).parse(text), BooleanClause.Occur.MUST)
                    .add(allowed, BooleanClause.Occur.FILTER)
                    .build();
                Query vector = new KnnFloatVectorQuery("embedding", new float[]{1.0f, 0.0f}, 3, allowed);
                if (mode.equals("refresh")) {
                    writer.updateDocument(new Term("id", "A"), document(new Article(
                        "A", "Updated bicycle repair tools", "public", new float[]{0.8f, 0.6f})));
                    Query updated = new TermQuery(new Term("body", "updated"));
                    System.out.println("Old reader matches: " + searcher.count(updated));
                    try (var refreshed = DirectoryReader.openIfChanged(reader, writer)) {
                        if (refreshed == null) {
                            throw new IllegalStateException("Expected a changed reader");
                        }
                        System.out.println("New reader matches: " + new IndexSearcher(refreshed).count(updated));
                    }
                    return;
                }
                if (mode.equals("vector") || mode.equals("hybrid")) {
                    System.out.println("Synthetic query vector: [1, 0]; not an embedding of the input text");
                }
                if (mode.equals("hybrid")) {
                    var fused = new HashMap<String, Double>();
                    addRanks(searcher, searcher.search(lexical, 3), fused);
                    addRanks(searcher, searcher.search(vector, 3), fused);
                    var entries = new ArrayList<>(fused.entrySet());
                    entries.sort(Comparator.<Map.Entry<String, Double>>comparingDouble(Map.Entry::getValue)
                        .reversed().thenComparing(Map.Entry::getKey));
                    entries.forEach(entry -> System.out.printf("%s RRF=%.6f%n", entry.getKey(), entry.getValue()));
                } else {
                    Query query = mode.equals("vector") ? vector : lexical;
                    for (var hit : searcher.search(query, 3).scoreDocs) {
                        var stored = searcher.storedFields().document(hit.doc);
                        System.out.printf("%s %.4f %s%n", stored.get("id"), hit.score, stored.get("body"));
                        if (mode.equals("lexical")) {
                            System.out.println(searcher.explain(query, hit.doc));
                        }
                    }
                }
            }
        }
    }

    static Document document(Article article) {
        var document = new Document();
        document.add(new StringField("id", article.id(), Field.Store.YES));
        document.add(new StringField("access", article.access(), Field.Store.NO));
        document.add(new TextField("body", article.body(), Field.Store.YES));
        document.add(new KnnFloatVectorField("embedding", article.vector(), VectorSimilarityFunction.COSINE));
        return document;
    }

    static void addRanks(IndexSearcher searcher, TopDocs hits, Map<String, Double> fused) throws Exception {
        for (int rankIndex = 0; rankIndex < hits.scoreDocs.length; rankIndex++) {
            String stableId = searcher.storedFields().document(hits.scoreDocs[rankIndex].doc).get("id");
            fused.merge(stableId, 1.0 / (60 + rankIndex + 1), Double::sum);
        }
    }
}