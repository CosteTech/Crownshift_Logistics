
'use server';

/**
 * @fileOverview A flow for generating instant shipping quotes based on package details.
 *
 * - generateInstantQuote - A function that takes package details and returns a shipping quote.
 * - InstantQuoteInput - The input type for the generateInstantQuote function.
 * - InstantQuoteOutput - The return type for the generateInstantQuote function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InstantQuoteInputSchema = z.object({
  name: z.string().describe("The user's full name."),
  email: z.string().email().describe("The user's email address."),
  origin: z.string().describe('The origin location of the package.'),
  destination: z.string().describe('The destination location of the package.'),
  length: z.number().describe('The length of the package in centimeters.'),
  width: z.number().describe('The width of the package in centimeters.'),
  height: z.number().describe('The height of the package in centimeters.'),
  weight: z.number().describe('The weight of the package in kilograms.'),
});
export type InstantQuoteInput = z.infer<typeof InstantQuoteInputSchema>;

const InstantQuoteOutputSchema = z.object({
  quoteKES: z.number().describe('The estimated shipping quote in Kenyan Shillings (KES).'),
  quoteUSD: z.number().describe('The estimated shipping quote in US Dollars (USD).'),
  breakdown: z.string().describe('A breakdown of the factors contributing to the quote.'),
});
export type InstantQuoteOutput = z.infer<typeof InstantQuoteOutputSchema>;

export async function generateInstantQuote(input: InstantQuoteInput): Promise<InstantQuoteOutput> {
  return instantQuoteFlow(input);
}

const instantQuotePrompt = ai.definePrompt({
  name: 'instantQuotePrompt',
  input: {schema: InstantQuoteInputSchema},
  output: {schema: InstantQuoteOutputSchema},
  prompt: `You are a shipping quote generator for Crownshift Logistics. Given the following package details, generate an instant shipping quote in both US Dollars (USD) and Kenyan Shillings (KES).

Assume a conversion rate of 1 USD = 130 KES.

Customer Name: {{{name}}}
Customer Email: {{{email}}}
Origin: {{{origin}}}
Destination: {{{destination}}}
Dimensions: {{{length}}}x{{{width}}}x{{{height}}} cm
Weight: {{{weight}}} kg

Consider these factors when generating the quote:
- Distance between origin and destination
- Package dimensions and weight
- Any potential surcharges or discounts

Return the quotes as numbers and provide a breakdown of the factors contributing to the quote.
`,
});

const instantQuoteFlow = ai.defineFlow(
  {
    name: 'instantQuoteFlow',
    inputSchema: InstantQuoteInputSchema,
    outputSchema: InstantQuoteOutputSchema,
  },
  async input => {
    try {
      const {output} = await instantQuotePrompt(input);
      if (!output) {
        throw new Error('AI returned empty output');
      }
      return output;
    } catch (error) {
      // SECURITY FIX P1: Classify errors and provide generic message
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      let userMessage = 'Unable to generate quote. Please try again later.';
      
      if (errorMessage.includes('API key')) {
        console.warn('Quote generation error: API key missing');
        userMessage = 'Quote service is temporarily unavailable. Please try again later.';
      } else if (errorMessage.includes('Quota')) {
        console.warn('Quote generation error: Quota exceeded');
        userMessage = 'Too many quote requests. Please wait before requesting another quote.';
      } else if (errorMessage.includes('Rate limit')) {
        console.warn('Quote generation error: Rate limit hit');
        userMessage = 'Quote service is busy. Please try again in a few moments.';
      } else if (errorMessage.includes('Network') || errorMessage.includes('timeout')) {
        console.warn('Quote generation error: Network issue');
        userMessage = 'Network error. Please check your connection and try again.';
      }
      
      throw new Error(userMessage);
    }
  }
);
