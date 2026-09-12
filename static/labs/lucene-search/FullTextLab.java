import java.util.List;
import java.util.Set;
import org.apache.lucene.analysis.Analyzer;
import org.apache.lucene.analysis.LowerCaseFilter;
import org.apache.lucene.analysis.TokenStream;
import org.apache.lucene.analysis.core.KeywordAnalyzer;
import org.apache.lucene.analysis.miscellaneous.PerFieldAnalyzerWrapper;
import org.apache.lucene.analysis.en.EnglishAnalyzer;
import org.apache.lucene.analysis.miscellaneous.ASCIIFoldingFilter;
import org.apache.lucene.analysis.ngram.EdgeNGramTokenFilter;
import org.apache.lucene.analysis.ngram.NGramTokenFilter;
import org.apache.lucene.analysis.shingle.ShingleFilter;
import org.apache.lucene.analysis.standard.StandardTokenizer;
import org.apache.lucene.analysis.synonym.SynonymGraphFilter;
import org.apache.lucene.analysis.synonym.SynonymMap;
import org.apache.lucene.analysis.tokenattributes.CharTermAttribute;
import org.apache.lucene.analysis.tokenattributes.OffsetAttribute;
import org.apache.lucene.analysis.tokenattributes.PositionIncrementAttribute;
import org.apache.lucene.analysis.tokenattributes.PositionLengthAttribute;
import org.apache.lucene.util.CharsRef;
import org.apache.lucene.util.BytesRef;
import org.apache.lucene.document.Document;
import org.apache.lucene.document.Field;
import org.apache.lucene.document.IntPoint;
import org.apache.lucene.document.NumericDocValuesField;
import org.apache.lucene.document.SortedDocValuesField;
import org.apache.lucene.document.StoredField;
import org.apache.lucene.document.StringField;
import org.apache.lucene.document.TextField;
import org.apache.lucene.facet.FacetsConfig;
import org.apache.lucene.facet.DrillDownQuery;
import org.apache.lucene.facet.FacetsCollectorManager;
import org.apache.lucene.facet.sortedset.DefaultSortedSetDocValuesReaderState;
import org.apache.lucene.facet.sortedset.SortedSetDocValuesFacetCounts;
import org.apache.lucene.facet.sortedset.SortedSetDocValuesFacetField;
import org.apache.lucene.index.DirectoryReader;
import org.apache.lucene.index.IndexWriter;
import org.apache.lucene.index.IndexWriterConfig;
import org.apache.lucene.index.Term;
import org.apache.lucene.search.BooleanClause;
import org.apache.lucene.search.BooleanQuery;
import org.apache.lucene.search.BoostQuery;
import org.apache.lucene.search.DisjunctionMaxQuery;
import org.apache.lucene.search.FuzzyQuery;
import org.apache.lucene.search.IndexSearcher;
import org.apache.lucene.search.MatchAllDocsQuery;
import org.apache.lucene.search.PhraseQuery;
import org.apache.lucene.search.PrefixQuery;
import org.apache.lucene.search.Query;
import org.apache.lucene.search.RegexpQuery;
import org.apache.lucene.search.Sort;
import org.apache.lucene.search.SortField;
import org.apache.lucene.search.TermQuery;
import org.apache.lucene.search.WildcardQuery;
import org.apache.lucene.search.join.QueryBitSetProducer;
import org.apache.lucene.search.join.ScoreMode;
import org.apache.lucene.search.join.ToParentBlockJoinQuery;
import org.apache.lucene.search.suggest.InputIterator;
import org.apache.lucene.search.suggest.analyzing.AnalyzingSuggester;
import org.apache.lucene.search.spell.DirectSpellChecker;
import org.apache.lucene.search.spell.SuggestMode;
import org.apache.lucene.search.uhighlight.DefaultPassageFormatter;
import org.apache.lucene.search.uhighlight.UnifiedHighlighter;
import org.apache.lucene.store.ByteBuffersDirectory;

public class FullTextLab {
    static Analyzer analyzer(String mode) throws Exception {
        if (mode.equals("english")) return new EnglishAnalyzer();
        if (mode.equals("keyword")) return new KeywordAnalyzer();
        var synonyms = new SynonymMap.Builder(true);
        synonyms.add(new CharsRef("nyc"), new CharsRef("new\u0000york\u0000city"), true);
        SynonymMap synonymMap = synonyms.build();
        return new Analyzer() {
            @Override
            protected TokenStreamComponents createComponents(String field) {
                var tokenizer = new StandardTokenizer();
                TokenStream tokens = new LowerCaseFilter(tokenizer);
                tokens = new ASCIIFoldingFilter(tokens);
                tokens = switch (mode) {
                    case "ngrams" -> new NGramTokenFilter(tokens, 2, 3, false);
                    case "edge" -> new EdgeNGramTokenFilter(tokens, 2, 3, false);
                    case "shingles" -> new ShingleFilter(tokens, 2, 2);
                    case "synonyms" -> new SynonymGraphFilter(tokens, synonymMap, false);
                    default -> tokens;
                };
                return new TokenStreamComponents(tokenizer, tokens);
            }
        };
    }

    public static void main(String[] args) throws Exception {
        String mode = args.length == 0 ? "edge" : args[0];
        if (List.of("patterns", "multifield", "proximity", "facets", "drilldown", "spell", "ranges", "suggest", "joins").contains(mode)) {
            if (mode.equals("joins")) joins();
            else features(mode);
            return;
        }
        if (!List.of("standard", "english", "keyword", "ngrams", "edge", "shingles", "synonyms").contains(mode)) {
            throw new IllegalArgumentException("Modes: standard, english, keyword, ngrams, edge, shingles, synonyms");
        }
        String text = args.length > 1 ? args[1] : "Bicycle repair";
        try (var analyzer = analyzer(mode); var stream = analyzer.tokenStream("body", text)) {
            var term = stream.addAttribute(CharTermAttribute.class);
            var increment = stream.addAttribute(PositionIncrementAttribute.class);
            var length = stream.addAttribute(PositionLengthAttribute.class);
            var offsets = stream.addAttribute(OffsetAttribute.class);
            stream.reset();
            int position = -1;
            while (stream.incrementToken()) {
                position += increment.getPositionIncrement();
                System.out.printf("%s position=%d length=%d offsets=%d:%d%n",
                    term, position, length.getPositionLength(), offsets.startOffset(), offsets.endOffset());
            }
            stream.end();
        }
    }

    static Query allowed(Query query) {
        return new BooleanQuery.Builder()
            .add(query, BooleanClause.Occur.MUST)
            .add(new TermQuery(new Term("access", "public")), BooleanClause.Occur.FILTER).build();
    }

    static void printHits(IndexSearcher searcher, String label, Query query) throws Exception {
        var ids = new java.util.ArrayList<String>();
        for (var hit : searcher.search(allowed(query), 10).scoreDocs) {
            ids.add(searcher.storedFields().document(hit.doc).get("id"));
        }
        System.out.println(label + "=" + String.join(",", ids));
    }

    static void features(String mode) throws Exception {
        try (var textAnalyzer = analyzer("standard"); var idAnalyzer = new KeywordAnalyzer();
             var analyzer = new PerFieldAnalyzerWrapper(textAnalyzer, java.util.Map.of("id", idAnalyzer));
             var directory = new ByteBuffersDirectory();
             var writer = new IndexWriter(directory, new IndexWriterConfig(analyzer))) {
            String[][] rows = {
                {"A", "Bicycle repairs", "repair bicycle tire safely", "2024", "Repair", "public"},
                {"B", "Travel guide", "bicycle tire repair repair", "2022", "Travel", "public"},
                {"C", "Bicycle secrets", "bicycle tire repair", "2025", "Repair", "private"}
            };
            var config = new FacetsConfig();
            for (String[] row : rows) {
                var document = new Document();
                document.add(new StringField("id", row[0], Field.Store.YES));
                document.add(new SortedDocValuesField("id", new BytesRef(row[0])));
                document.add(new TextField("title", row[1], Field.Store.YES));
                document.add(new TextField("body", row[2], Field.Store.YES));
                if (row[5].equals("public")) document.add(new TextField("public_terms", row[2], Field.Store.NO));
                int year = Integer.parseInt(row[3]);
                document.add(new IntPoint("year", year));
                document.add(new NumericDocValuesField("year", year));
                document.add(new StoredField("year", year));
                document.add(new SortedSetDocValuesFacetField("category", row[4]));
                document.add(new StringField("access", row[5], Field.Store.NO));
                writer.addDocument(config.build(document));
            }
            try (var reader = DirectoryReader.open(writer)) {
                var searcher = new IndexSearcher(reader);
                if (mode.equals("patterns")) {
                    printHits(searcher, "prefix", new PrefixQuery(new Term("body", "bicy")));
                    printHits(searcher, "fuzzy", new FuzzyQuery(new Term("body", "bicyle"), 1));
                    printHits(searcher, "wildcard", new WildcardQuery(new Term("body", "*cycle")));
                    printHits(searcher, "regex", new RegexpQuery(new Term("body", "bi.*")));
                } else if (mode.equals("multifield")) {
                    Query query = new DisjunctionMaxQuery(List.of(
                        new BoostQuery(new TermQuery(new Term("title", "bicycle")), 3),
                        new TermQuery(new Term("body", "bicycle"))), 0.1f);
                    printHits(searcher, "title-boost", query);
                } else if (mode.equals("proximity")) {
                    printHits(searcher, "slop0", new PhraseQuery(0, "body", "bicycle", "repair"));
                    printHits(searcher, "slop1", new PhraseQuery(1, "body", "bicycle", "repair"));
                    printHits(searcher, "slop2", new PhraseQuery(2, "body", "bicycle", "repair"));
                } else if (mode.equals("spell")) {
                    var checker = new DirectSpellChecker();
                    checker.setThresholdFrequency(0);
                    for (var suggestion : checker.suggestSimilar(new Term("public_terms", "bicyle"), 5, reader, SuggestMode.SUGGEST_ALWAYS)) {
                        System.out.println("spelling=" + suggestion.string);
                    }
                } else if (mode.equals("facets") || mode.equals("drilldown")) {
                    Query query = allowed(new TermQuery(new Term("body", "bicycle")));
                    if (mode.equals("drilldown")) {
                        var selected = new DrillDownQuery(config, query);
                        selected.add("category", "Repair");
                        query = selected;
                    }
                    var collector = searcher.search(query, new FacetsCollectorManager());
                    var state = new DefaultSortedSetDocValuesReaderState(reader, config);
                    var counts = new SortedSetDocValuesFacetCounts(state, collector);
                    System.out.println(counts.getTopChildren(10, "category"));
                    var hits = searcher.search(query, 10);
                    var highlighter = UnifiedHighlighter.builder(searcher, analyzer)
                        .withFormatter(new DefaultPassageFormatter("<b>", "</b>", " ... ", true)).build();
                    for (String snippet : highlighter.highlight("body", query, hits)) System.out.println(snippet);
                } else if (mode.equals("ranges")) {
                    Query query = allowed(IntPoint.newRangeQuery("year", 2020, 2024));
                    var sort = new Sort(new SortField("year", SortField.Type.INT, true),
                        new SortField("id", SortField.Type.STRING));
                    var first = searcher.search(query, 1, sort);
                    var second = searcher.searchAfter(first.scoreDocs[0], query, 1, sort);
                    System.out.println("page1=" + searcher.storedFields().document(first.scoreDocs[0].doc).get("id"));
                    System.out.println("page2=" + searcher.storedFields().document(second.scoreDocs[0].doc).get("id"));
                } else if (mode.equals("suggest")) {
                    try (var scratch = new ByteBuffersDirectory()) {
                        var suggester = new AnalyzingSuggester(scratch, "completion", analyzer);
                        suggester.build(new InputIterator() {
                            int position = -1;
                            final String[] terms = {"Bicycle repair", "Bicycle rental"};
                            @Override public BytesRef next() { return ++position < terms.length ? new BytesRef(terms[position]) : null; }
                            @Override public long weight() { return position == 0 ? 20 : 10; }
                            @Override public BytesRef payload() { return null; }
                            @Override public boolean hasPayloads() { return false; }
                            @Override public Set<BytesRef> contexts() { return null; }
                            @Override public boolean hasContexts() { return false; }
                        });
                        System.out.println(suggester.lookup("bicy", false, 5));
                    }
                }
            }
        }
    }

    static Document child(String color, String size) {
        var document = new Document();
        document.add(new StringField("color", color, Field.Store.NO));
        document.add(new StringField("size", size, Field.Store.NO));
        return document;
    }

    static void joins() throws Exception {
        try (var analyzer = new KeywordAnalyzer(); var directory = new ByteBuffersDirectory();
             var writer = new IndexWriter(directory, new IndexWriterConfig(analyzer))) {
            var parent = new Document();
            parent.add(new StringField("kind", "parent", Field.Store.NO));
            parent.add(new StringField("id", "shirt-1", Field.Store.YES));
            writer.addDocuments(List.of(child("red", "small"), child("blue", "large"), parent));
            try (var reader = DirectoryReader.open(writer)) {
                var searcher = new IndexSearcher(reader);
                var parents = new QueryBitSetProducer(new TermQuery(new Term("kind", "parent")));
                for (String size : List.of("small", "large")) {
                    Query children = new BooleanQuery.Builder()
                        .add(new TermQuery(new Term("color", "red")), BooleanClause.Occur.MUST)
                        .add(new TermQuery(new Term("size", size)), BooleanClause.Occur.MUST).build();
                    Query joined = new ToParentBlockJoinQuery(children, parents, ScoreMode.None);
                    System.out.println("red+" + size + " parents=" + searcher.count(joined));
                }
            }
        }
    }
}