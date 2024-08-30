import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import Fastify from 'fastify';

const openAIApiKey = ''
const llm = new ChatOpenAI({ openAIApiKey });

// const llm = new FakeListChatModel({
//   responses: ["i don't liked mondays", "I don't like Mondays"],
// });

const fastify = Fastify();

// Declare a route
fastify.get('/', async function handler(request, reply) {
  const punctuationTemplate = `Given a sentence, add punctuation where needed. 
      sentence: {sentence}
      sentence with punctuation:  
    `;
  const punctuationPrompt = PromptTemplate.fromTemplate(punctuationTemplate);

  const punctuated_sentence = RunnableSequence.from([
    punctuationPrompt,
    llm,
    new StringOutputParser(),
  ]);

  const grammarTemplate = `Given a sentence correct the grammar.
      sentence: {punctuated_sentence}
      sentence with correct grammar: 
      `;

  const grammarPrompt = PromptTemplate.fromTemplate(grammarTemplate);

  const grammar_chain = RunnableSequence.from([
    grammarPrompt,
    llm,
    new StringOutputParser(),
  ]);

  const translationTemplate = `Given a sentence, translate that sentence into {language}
      sentence: {grammar_chain}
      translated sentence:
  `;
  const translationPrompt = PromptTemplate.fromTemplate(translationTemplate);

  const translactionChain = RunnableSequence.from([
    translationPrompt,
    llm,
    new StringOutputParser(),
    (prev) => console.log(prev),
  ]);

  const chain = RunnableSequence.from([
    { punctuated_sentence },
    { grammar_chain },
    translactionChain,
  ]);

  const response = await chain.invoke({
    sentence: 'i dont liked mondays',
    language: 'french',
  });

  reply.send({ response });
});

// Run the server!
fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
