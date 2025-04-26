import { NextResponse } from "next/server";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

interface AnalyzeRequest {
  code: string;
  question: string;
}

export async function POST(request: Request) {
  try {
    const { code, question }: AnalyzeRequest = await request.json();

    if (!code || !question) {
      return NextResponse.json(
        { error: "Code and question are required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key is not configured" },
        { status: 500 }
      );
    }

    // Initialize the OpenAI model
    const model = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4",
    });

    // Create a prompt template
    const prompt = PromptTemplate.fromTemplate(`
      Analyze the following code and answer the question:
      
      Code:
      {code}
      
      Question: {question}
      
      Please provide a detailed analysis and answer.
    `);

    // Create the chain
    const chain = prompt.pipe(model).pipe(new StringOutputParser());

    // Execute the chain
    const response = await chain.invoke({
      code,
      question,
    });

    return NextResponse.json({ analysis: response });
  } catch (error) {
    console.error("Error in analyze route:", error);
    return NextResponse.json(
      { error: "An error occurred during analysis" },
      { status: 500 }
    );
  }
}