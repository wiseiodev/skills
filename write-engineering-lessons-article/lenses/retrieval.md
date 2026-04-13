# Lens: Retrieval, Grounding, and Doc-Search Incidents

Load this lens **only** when the gathered evidence explicitly involves retrieval, embeddings, ranking, RAG, grounding, or doc-search. Do not introduce this vocabulary into an article whose evidence does not already use it.

## Recurring patterns

If the incident shows several of these, name them explicitly rather than flattening the story:

- the user asked a straightforward setup or how-to question
- the correct source material already existed in the corpus
- retrieval returned weak, generic, or broadly-scoped documents
- ranking let a broad reference page outrank the client-specific page
- context was too thin, too noisy, or truncated at the wrong boundary
- the answerer improvised setup steps from general prior knowledge
- evaluation initially measured "sounds reasonable" instead of "grounded in retrieved content"
- reliability only arrived once retrieval and grounding enforced the same rule

Do not reduce the article to "the embeddings were bad" or "the prompt was weak" if the real failure was several layers reinforcing each other's mistakes.

## Useful stage shapes

These are example shapes, not a template. Include only stages backed by real artifacts (commit, PR, ADR, test, dated log). Omit any stage that does not survive the evidence discipline in REFERENCE.md.

- naive retrieval or initial search path
- first ranking or filtering attempt
- retrieval or scoring rewrite
- grounding rule or prompt constraint
- evaluation harness tied to actual bad prompts
- follow-up ADR that captured the rule

## Evaluation specifics

Good grounding evals for this domain include:

- exact bad prompts that kept failing, re-run after each change
- negative checks for known hallucinations
- retrieval ordering assertions (the client-specific page ranks above the generic page)
- client-specific grounding rules (the answer cites a client-tagged chunk, or refuses)

If the team did not run these, say so plainly. Do not write as if they did.

## Vocabulary

Only introduce terms like *retrieval*, *ranking*, *grounding*, *abstention*, *top-k*, *chunking*, *rerank*, *embedding*, *client scoping*, or *hybrid search* if the gathered evidence already uses them. Otherwise, prefer the team's existing vocabulary.
