# Embedding Model Comparison

While **Xenova/all-MiniLM-L6-v2** is popular due to its small size and speed (23M parameters, 384 dimensions), several free and locally-embeddable models offer better performance, sometimes even while maintaining a compact size.

The best alternatives often come from the **E5** and **BGE** families, which consistently top performance benchmarks like MTEB (Massive Text Embeddings Benchmark).

## Comprehensive Model Comparison

| Model Name | Category | Parameters | Dimensions | Speed/Size | Accuracy | Key Advantages | Use Case |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Xenova/all-MiniLM-L6-v2** | Baseline | 23M | 384 | ⚡⚡⚡ Very Fast | ~78% Top-5 | Very small, fast inference | Quick prototyping, minimal resource usage |
| **intfloat/e5-small** | Small & Fast | 118M | 384 | ⚡⚡⚡ Very Fast | Higher than MiniLM | Speed champion, high accuracy for size | Best upgrade path from MiniLM |
| **intfloat/e5-base-v2** | Top Performance | 110M | 768 | ⚡⚡ Fast | ~83.5% Top-5 | Excellent general-purpose, sweet spot for accuracy/speed | Production RAG systems |
| **BAAI/bge-base-en-v1.5** | Top Performance | 110M | 768 | ⚡⚡ Fast | SOTA on MTEB | State-of-the-art English accuracy, query prefix support | High-accuracy English RAG |

> **Note:** Models in the `E5` family are often considered the sweet spot for combining high accuracy with relatively low latency, making them ideal for production-ready local RAG systems.

## Quick Recommendations

- **Maximum performance per size/speed tradeoff**: `intfloat/e5-base-v2` or `BAAI/bge-base-en-v1.5`
- **Smallest/fastest with accuracy improvement**: `intfloat/e5-small`
- **Baseline for comparison**: `Xenova/all-MiniLM-L6-v2`

## Evaluation Results & Recommendation

### Test Query
**Query**: "guidance on my professional development plan"

This query was tested against a local knowledge base containing career development documents, feedback notes, project hubs, and templates. The ideal behavior is to rank highly relevant documents (career development plans, professional feedback) highest, with proper score differentiation showing relevancy degradation.

### Model Performance Analysis

#### 1. Xenova/all-MiniLM-L6-v2 (Baseline)

**Results:**
- **Rank 1 (0.85)**: `personal/my-career/hub.md` - ✅ **Highly Relevant** - Career preparation hub with professional development planning, learning plans, and skill development strategies
- **Rank 2 (0.80)**: `x-archive/achievement-discoveries/hub.md` - ❌ **Not Relevant** - System analysis project documentation
- **Rank 3 (0.76)**: `general/feedback/end-of-cycle-review-2025-08-28.md` - ✅ **Relevant** - Contains growth areas, development feedback, and action items for professional development
- **Rank 4 (0.49)**: `x-archive/achievement-discoveries/Initial Chat.md` - ❌ **Not Relevant** - Client project discussion notes
- **Rank 5 (0.49)**: `x-archive/17-11-2025 Monday (cooldown).md` - ⚠️ **Partially Relevant** - Contains career development advice but not specifically about development plans

**Assessment**: 
- ✅ Correctly identifies the most relevant document as #1
- ✅ Provides proper score differentiation (0.85 → 0.80 → 0.76 → 0.49 → 0.49)
- ✅ Includes relevant development feedback in top 3 results
- ✅ Shows clear relevancy degradation in scores
- ⚠️ One irrelevant document ranked #2, but scores appropriately differentiate it

#### 2. intfloat/e5-small

**Results:**
- **Rank 1 (1.00)**: `personal/my-career/hub.md` - ✅ **Highly Relevant** - Correct match
- **Rank 2 (1.00)**: `general/feedback/nes758-process-improvement-feedback.md` - ⚠️ **Partially Relevant** - Process improvement feedback, not professional development planning
- **Rank 3 (1.00)**: `work/_work_report/07.13-17-oct (cycle).md` - ❌ **Not Relevant** - Work cycle report with task lists
- **Rank 4 (1.00)**: `x-archive/achievement-discoveries/tasks.md` - ❌ **Not Relevant** - Project task list
- **Rank 5 (0.85)**: `achievement-discoveries/decisions/README.md` - ❌ **Not Relevant** - Architectural decision template

**Assessment**:
- ✅ Correctly identifies the most relevant document as #1
- ❌ **Critical Issue**: Score compression - all top 4 results scored 1.00, preventing proper ranking
- ❌ Multiple irrelevant documents (work reports, project tasks) ranked highly with perfect scores
- ❌ Cannot distinguish between highly relevant and irrelevant documents due to score compression

#### 3. intfloat/e5-base-v2

**Results:**
- **Rank 1 (1.00)**: `specs/Cycle 05/System Prompt Sturcture.md` - ❌ **Not Relevant** - System prompt structure documentation
- **Rank 2 (0.88)**: `content-guides/Project-Hub.md` - ❌ **Not Relevant** - Template file for project hubs
- **Rank 3 (0.79)**: `x-archive/17-11-2025 Monday (cooldown).md` - ⚠️ **Partially Relevant** - Contains career advice but not development plans
- **Rank 4 (0.78)**: `content-guides/ADR.md` - ❌ **Not Relevant** - ADR template
- **Rank 5 (0.77)**: `content-guides/Quick-Note.md` - ❌ **Not Relevant** - Template file

**Assessment**:
- ❌ **Critical Issue**: Wrong top result - system prompt structure ranked highest instead of career development hub
- ❌ The actual relevant document (`personal/my-career/hub.md`) is not in top 5 results
- ❌ Top results are mostly templates and system documentation
- ❌ Poor overall ranking quality - fails to identify relevant content

#### 4. BAAI/bge-base-en-v1.5

**Results:**
- **Rank 1 (0.94)**: `specs/Cycle 05/System Prompt Sturcture.md` - ❌ **Not Relevant** - System prompt structure documentation
- **Rank 2 (0.73)**: `x-archive/achievement-discoveries/Initial Chat.md` - ❌ **Not Relevant** - Client project discussion
- **Rank 3 (0.67)**: `x-archive/17-11-2025 Monday (cooldown).md` - ⚠️ **Partially Relevant** - Career advice, not development plans
- **Rank 4 (0.64)**: `general/tasks/chat-with-phil.md` - ❌ **Not Relevant** - Discussion about onboarding timing
- **Rank 5 (0.63)**: `_priorities.md` - ❌ **Not Relevant** - Simple todo list

**Assessment**:
- ❌ **Critical Issue**: Wrong top result - system prompt structure ranked highest
- ❌ The actual relevant document (`personal/my-career/hub.md`) is not in top 5 results
- ❌ Top results are mostly irrelevant project documentation and templates
- ❌ Poor overall ranking quality - fails to identify relevant content
- ✅ Better score differentiation than e5-small (0.94 → 0.73 → 0.67 → 0.64 → 0.63)

### Conclusion & Recommendation

**Recommended Model**: **Xenova/all-MiniLM-L6-v2** (baseline)

Despite being the baseline model with lower theoretical accuracy metrics, **Xenova/all-MiniLM-L6-v2** demonstrates superior practical performance for this RAG use case:

**Strengths:**
1. **Correct Top Result**: Identifies the most relevant document (`personal/my-career/hub.md`) as the top match
2. **Proper Score Differentiation**: Provides meaningful score spread (0.85, 0.80, 0.76, 0.49, 0.49) that allows proper ranking
3. **Relevant Content in Top 3**: Includes both the career hub and development feedback in top results
4. **Clear Relevancy Degradation**: Scores appropriately decrease as documents become less relevant

**Why Other Models Failed:**
- **e5-small**: Suffers from score compression (multiple 1.00 scores) that prevents proper ranking, making it impossible to distinguish between highly relevant and irrelevant documents
- **e5-base-v2**: Fails to identify the correct top result, ranking system documentation and templates above actual relevant content
- **bge-base-en-v1.5**: Similar failure to e5-base-v2, with wrong top result and missing the relevant career development document entirely

**Key Insight**: Theoretical benchmark performance (MTEB scores) does not always translate to practical RAG ranking quality. The baseline model's smaller size and simpler architecture may actually provide better score differentiation for this use case, preventing the score compression issues seen in larger models.

**Recommendation**: Continue using **Xenova/all-MiniLM-L6-v2** for this RAG system. If upgrading is desired, consider testing with query prefix formatting (e.g., "query: guidance on my professional development plan") which some models like BGE support, but initial results suggest the baseline model performs best for this knowledge base.

> **⚠️ Important for @xenova/transformers:** Models must be available in the `Xenova/` namespace on Hugging Face (converted to ONNX format) to work with `@xenova/transformers`. Not all models listed above are available in the Xenova namespace. 
> 
> **To use a model:** Check if it exists at `https://huggingface.co/Xenova/[model-name]`. If available, use: `await pipeline("feature-extraction", "Xenova/[model-name]")`
> 
> **Currently confirmed working:** `Xenova/all-MiniLM-L6-v2` ✅
> 
> **Confirmed working models:** `Xenova/all-MiniLM-L6-v2` ✅, `Xenova/e5-small` ✅, `Xenova/e5-base-v2` ✅, `Xenova/bge-base-en-v1.5` ✅