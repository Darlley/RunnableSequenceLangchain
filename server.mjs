import { StringOutputParser } from '@langchain/core/output_parsers';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnablePassthrough, RunnableSequence } from '@langchain/core/runnables';
import { ChatOpenAI } from '@langchain/openai';
import Fastify from 'fastify';

import dotenv from 'dotenv';
dotenv.config();

const openAIApiKey = process.env.OPEN_API_KEY;
const llm = new ChatOpenAI({ openAIApiKey });

const fastify = Fastify();

// Declare a route
fastify.get('/', async function handler(request, reply) {
  const punctuationTemplate = `Given a sentence, add punctuation where needed. 
    sentence: {sentence}
    sentence with punctuation:
  `;

  const grammarTemplate = `Given a sentence correct the grammar.
    sentence: {punctuated_sentence}
    sentence with correct grammar: 
  `;

  const translationTemplate = `Given a sentence, translate that sentence into {language}
    sentence: {grammatically_correct_sentence}
    translated sentence:
  `;
  
  const punctuationPrompt = PromptTemplate.fromTemplate(punctuationTemplate);
  const grammarPrompt = PromptTemplate.fromTemplate(grammarTemplate);
  const translationPrompt = PromptTemplate.fromTemplate(translationTemplate);

  const punctuationChain = RunnableSequence.from([ punctuationPrompt, llm, new StringOutputParser() ]);
  const grammarChain = RunnableSequence.from([ grammarPrompt, llm, new StringOutputParser() ]);
  const translactionChain = RunnableSequence.from([ translationPrompt, llm, new StringOutputParser() ]);

  const chain = RunnableSequence.from([
    { 
      punctuated_sentence: punctuationChain,
      original_input: new RunnablePassthrough()
    },
    { 
      grammatically_correct_sentence: grammarChain,
      language: ({ original_input }) => original_input.language
    },
    translactionChain
  ]);

  const response = await chain.invoke({
    sentence: 'eu ainda num sei falar franceis',
    language: 'french',
  });

  console.log(response)

  reply.send({ response });
});

// Run the server!
fastify.listen({ port: 3000 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
});
