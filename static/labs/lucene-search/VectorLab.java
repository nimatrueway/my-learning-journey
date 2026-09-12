import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Random;
import org.apache.lucene.analysis.standard.StandardAnalyzer;
import org.apache.lucene.codecs.KnnVectorsFormat;
import org.apache.lucene.codecs.lucene103.Lucene103Codec;
import org.apache.lucene.codecs.lucene99.Lucene99HnswScalarQuantizedVectorsFormat;
import org.apache.lucene.codecs.lucene99.Lucene99HnswVectorsFormat;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.document.KnnFloatVectorField;
import org.apache.lucene.document.StoredField;
import org.apache.lucene.document.StringField;
import org.apache.lucene.index.DirectoryReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.Term;
import org.apache.lucene.index.VectorSimilarityFunction;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.KnnFloatVectorQuery;
import org.apache.lucene.search.TermQuery;
import org.apache.lucene.store.ByteBuffersDirectory;

public class VectorLab {
  public record Chunk(String id, String parentId, String text, String access, float[] vector) {}
  public record Input(String model, String revision, String query, float[] queryVector, List<Chunk> chunks) {}
  public record Candidate(String id, String parentId, String text, float score) {}
  public record Candidates(String query, String model, String revision, List<Candidate> candidates) {}
  record Neighbor(int index, float score) {}

  static float[] randomVector(Random random, int dimensions) {
    float[] vector = new float[dimensions];
    for (int dimension = 0; dimension < dimensions; dimension++) {
      vector[dimension] = (float) random.nextGaussian();
    }
    return vector;
  }

  static void validate(float[] vector, int dimensions) {
    if (vector == null || vector.length != dimensions) throw new IllegalArgumentException("Dimension mismatch");
    double norm = 0;
    for (float value : vector) {
      if (!Float.isFinite(value)) throw new IllegalArgumentException("Non-finite vector");
      norm += value * (double) value;
    }
    if (norm == 0) throw new IllegalArgumentException("Zero cosine vector");
  }

  static List<Neighbor> exact(List<Chunk> chunks, float[] query, int count) {
    List<Neighbor> neighbors = new ArrayList<>();
    for (int index = 0; index < chunks.size(); index++) {
      Chunk chunk = chunks.get(index);
      if (chunk.access().equals("public")) {
        neighbors.add(new Neighbor(index, VectorSimilarityFunction.COSINE.compare(query, chunk.vector())));
      }
    }
    neighbors.sort(Comparator.comparingDouble(Neighbor::score).reversed()
        .thenComparing(neighbor -> chunks.get(neighbor.index()).id()));
    return neighbors.subList(0, Math.min(count, neighbors.size()));
  }

  public static void main(String[] args) throws Exception {
    boolean real = args.length > 0 && args[0].equals("real");
    int connections = args.length > 1 && !real ? Integer.parseInt(args[1]) : 16;
    int beam = args.length > 2 && !real ? Integer.parseInt(args[2]) : 100;
    boolean quantized = args.length > 3 && args[3].equals("quantized");
    ObjectMapper mapper = new ObjectMapper();
    List<Chunk> chunks = new ArrayList<>();
    List<float[]> queries = new ArrayList<>();
    Input input = null;
    if (real) {
      input = mapper.readValue(Path.of(args.length > 1 ? args[1] : "embeddings.json").toFile(), Input.class);
      chunks.addAll(input.chunks());
      queries.add(input.queryVector());
    } else {
      Random random = new Random(42);
      for (int index = 0; index < 3000; index++) {
        chunks.add(new Chunk("doc-" + index, "doc-" + index, "synthetic", index % 5 == 0 ? "private" : "public", randomVector(random, 64)));
      }
      for (int index = 0; index < 30; index++) queries.add(randomVector(random, 64));
    }
    if (chunks.isEmpty() || queries.getFirst() == null) throw new IllegalArgumentException("Empty input");
    int dimensions = queries.getFirst().length;
    HashSet<String> ids = new HashSet<>();
    for (Chunk chunk : chunks) {
      validate(chunk.vector(), dimensions);
      if (!ids.add(chunk.id())) throw new IllegalArgumentException("Duplicate chunk ID");
    }
    for (float[] query : queries) validate(query, dimensions);
    KnnVectorsFormat format = quantized
        ? new Lucene99HnswScalarQuantizedVectorsFormat(connections, beam)
        : new Lucene99HnswVectorsFormat(connections, beam);
    var config = new IndexWriterConfig(new StandardAnalyzer()).setUseCompoundFile(false);
    config.setCodec(new Lucene103Codec() {
      @Override public KnnVectorsFormat getKnnVectorsFormatForField(String field) { return format; }
    });
    long started = System.nanoTime();
    try (var directory = new ByteBuffersDirectory()) {
      try (var writer = new IndexWriter(directory, config)) {
        for (Chunk chunk : chunks) {
          Document document = new Document();
          document.add(new StringField("id", chunk.id(), Field.Store.YES));
          document.add(new StringField("access", chunk.access(), Field.Store.NO));
          document.add(new StoredField("parent", chunk.parentId()));
          document.add(new StoredField("text", chunk.text()));
          document.add(new KnnFloatVectorField("vector", chunk.vector(), VectorSimilarityFunction.COSINE));
          writer.addDocument(document);
        }
      }
      double buildMs = (System.nanoTime() - started) / 1e6;
      long bytes = 0;
      for (String file : directory.listAll()) bytes += directory.fileLength(file);
      try (var reader = DirectoryReader.open(directory)) {
        var searcher = new IndexSearcher(reader);
        var filter = new TermQuery(new Term("access", "public"));
        for (int warmup = 0; warmup < 5; warmup++) {
          searcher.search(new KnnFloatVectorQuery("vector", queries.getFirst(), 10, filter), 10);
        }
        double recall = 0;
        double[] milliseconds = new double[queries.size()];
        for (int queryIndex = 0; queryIndex < queries.size(); queryIndex++) {
          float[] query = queries.get(queryIndex);
          var expected = exact(chunks, query, 10);
          HashSet<String> expectedIds = new HashSet<>();
          for (Neighbor neighbor : expected) expectedIds.add(chunks.get(neighbor.index()).id());
          started = System.nanoTime();
          var hits = searcher.search(new KnnFloatVectorQuery("vector", query, 10, filter), 10);
          milliseconds[queryIndex] = (System.nanoTime() - started) / 1e6;
          List<Candidate> candidates = new ArrayList<>();
          int overlap = 0;
          for (var hit : hits.scoreDocs) {
            Document document = searcher.storedFields().document(hit.doc);
            if (expectedIds.contains(document.get("id"))) overlap++;
            candidates.add(new Candidate(document.get("id"), document.get("parent"), document.get("text"), hit.score));
          }
          recall += expectedIds.isEmpty() ? 1 : overlap / (double) expectedIds.size();
          if (real) {
            mapper.writerWithDefaultPrettyPrinter().writeValue(Path.of("candidates.json").toFile(),
                new Candidates(input.query(), input.model(), input.revision(), candidates));
            for (Candidate candidate : candidates) System.out.println(candidate.id() + " " + candidate.score() + " " + candidate.text());
          }
        }
        Arrays.sort(milliseconds);
        System.out.printf(Locale.ROOT, "format=%s M=%d beam=%d docs=%d segments=%d bytes=%d buildMs=%.2f recall@10=%.4f p50Ms=%.3f p95Ms=%.3f%n",
            format.getName(), connections, beam, chunks.size(), reader.leaves().size(), bytes, buildMs,
            recall / queries.size(), milliseconds[milliseconds.length / 2], milliseconds[(int) Math.ceil(milliseconds.length * .95) - 1]);
      }
    }
  }
}