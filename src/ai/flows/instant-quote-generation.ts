
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
<<<<<<< HEAD
  phone: z.string().optional().describe("The user's phone number."),
=======
>>>>>>> 62a311af5d8104f8c7ddde51d7976efdbe59aa3f
  origin: z.string().describe('The origin location of the package.'),
  destination: z.string().describe('The destination location of the package.'),
  length: z.number().describe('The length of the package in centimeters.'),
  width: z.number().describe('The width of the package in centimeters.'),
  height: z.number().describe('The height of the package in centimeters.'),
  weight: z.number().describe('The weight of the package in kilograms.'),
<<<<<<< HEAD
  packageType: z.enum(['standard', 'fragile', 'perishable', 'oversized', 'document']).optional()
    .describe('The type of package being shipped.'),
  urgency: z.enum(['standard', 'express', 'same-day']).optional()
    .describe('Delivery urgency level.'),
});
export type InstantQuoteInput = z.infer<typeof InstantQuoteInputSchema>;

const QuoteBreakdownSchema = z.object({
  baseRate: z.number().describe('Base transportation rate in USD.'),
  distanceCharge: z.number().describe('Charge based on distance in USD.'),
  volumetricSurcharge: z.number().describe('Surcharge for large volumes in USD.'),
  weightSurcharge: z.number().describe('Surcharge for heavy items in USD.'),
  handlingFee: z.number().describe('Special handling fees in USD.'),
  urgencySurcharge: z.number().describe('Express/same-day surcharge in USD.'),
  insuranceFee: z.number().describe('Insurance fee in USD.'),
});

const InstantQuoteOutputSchema = z.object({
  quoteKES: z.number().describe('The estimated shipping quote in Kenyan Shillings (KES).'),
  quoteUSD: z.number().describe('The estimated shipping quote in US Dollars (USD).'),
  breakdown: QuoteBreakdownSchema.describe('Detailed breakdown of quote components.'),
  estimatedDeliveryDays: z.number().describe('Estimated number of days for delivery.'),
  summary: z.string().describe('A brief summary of the quote for the customer.'),
  recommendations: z.string().describe('Packaging or shipping recommendations.'),
=======
});
export type InstantQuoteInput = z.infer<typeof InstantQuoteInputSchema>;

const InstantQuoteOutputSchema = z.object({
  quoteKES: z.number().describe('The estimated shipping quote in Kenyan Shillings (KES).'),
  quoteUSD: z.number().describe('The estimated shipping quote in US Dollars (USD).'),
  breakdown: z.string().describe('A breakdown of the factors contributing to the quote.'),
>>>>>>> 62a311af5d8104f8c7ddde51d7976efdbe59aa3f
});
export type InstantQuoteOutput = z.infer<typeof InstantQuoteOutputSchema>;

export async function generateInstantQuote(input: InstantQuoteInput): Promise<InstantQuoteOutput> {
  return instantQuoteFlow(input);
}

<<<<<<< HEAD
const PRICING_RULES = `
## CROWNSHIFT LOGISTICS PRICING RULES (Kenya-based operations)

### BASE RATES (in USD):
- Within Nairobi County: $5.00 base + $0.50/km
- Nairobi to Major Towns (Mombasa, Kisumu, Nakuru, Eldoret): $15.00 base + $0.30/km
- Inter-town deliveries: $10.00 base + $0.40/km
- Remote/Rural areas: $20.00 base + $0.60/km

### VOLUMETRIC WEIGHT:
Calculate: (L × W × H) / 5000 = volumetric kg
If volumetric weight > actual weight, charge based on volumetric weight.

### WEIGHT SURCHARGES:
- 0-5 kg: No surcharge
- 5-15 kg: +$2.00
- 15-30 kg: +$5.00
- 30-50 kg: +$10.00
- Over 50 kg: +$0.30 per additional kg

### VOLUME SURCHARGES (for large items):
- Over 0.1 m³ (100,000 cm³): +$3.00
- Over 0.5 m³ (500,000 cm³): +$8.00
- Over 1.0 m³: +$15.00

### PACKAGE TYPE SURCHARGES:
- Standard: $0
- Fragile: +$5.00 (includes careful handling)
- Perishable: +$8.00 (includes climate control)
- Oversized: +$12.00
- Document: -$2.00 (discount for envelopes)

### URGENCY SURCHARGES:
- Standard (3-5 days): $0
- Express (1-2 days): +30% of base rate
- Same-day: +60% of base rate

### INSURANCE:
- Optional: 3% of declared value (default: $2.00 minimum for basic coverage)

### KENYA LOCATIONS DISTANCE REFERENCE (approximate km from Nairobi):
- Mombasa: ~500 km
- Kisumu: ~350 km
- Nakuru: ~160 km
- Eldoret: ~310 km
- Thika: ~45 km
- Machakos: ~65 km
- Nyeri: ~150 km
- Meru: ~250 km
`;

=======
>>>>>>> 62a311af5d8104f8c7ddde51d7976efdbe59aa3f
const instantQuotePrompt = ai.definePrompt({
  name: 'instantQuotePrompt',
  input: {schema: InstantQuoteInputSchema},
  output: {schema: InstantQuoteOutputSchema},
<<<<<<< HEAD
  prompt: `You are a shipping quote calculator for Crownshift Logistics, a Kenya-based courier and moving company.

## YOUR TASK:
Generate an accurate, fair shipping quote based on the provided package details and our pricing rules.

## PRICING RULES:
${PRICING_RULES}

## CUSTOMER DETAILS:
- Name: {{{name}}}
- Email: {{{email}}}
- Phone: {{#if phone}}{{{phone}}}{{else}}Not provided{{/if}}

## SHIPMENT DETAILS:
- Origin: {{{origin}}}
- Destination: {{{destination}}}
- Dimensions: {{{length}}} × {{{width}}} × {{{height}}} cm
- Weight: {{{weight}}} kg
- Package Type: {{#if packageType}}{{{packageType}}}{{else}}standard{{/if}}
- Urgency: {{#if urgency}}{{{urgency}}}{{else}}standard{{/if}}

## INSTRUCTIONS:
1. Estimate the distance between origin and destination (use the reference distances or estimate based on Kenya geography)
2. Calculate volumetric weight: ({{length}} × {{width}} × {{height}}) / 5000
3. Use the HIGHER of actual weight ({{{weight}}} kg) or volumetric weight
4. Apply all relevant charges based on the pricing rules above
5. Sum all charges to get total in USD
6. Convert to KES at rate: 1 USD = 130 KES
7. Provide helpful recommendations for the customer

Be precise with calculations. Return only the numerical values for prices (no currency symbols).
`,
});


=======
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

>>>>>>> 62a311af5d8104f8c7ddde51d7976efdbe59aa3f
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
<<<<<<< HEAD
      
      // Validate output makes sense
      if (output.quoteUSD <= 0 || output.quoteKES <= 0) {
        console.warn('AI returned invalid quote, using fallback');
        return generateFallbackQuote(input);
      }
      
      return output;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Quote generation error:', errorMessage);
      
      // Use fallback quote system instead of throwing
      return generateFallbackQuote(input);
    }
  }
);

/**
 * Fallback quote calculator using deterministic rules
 * Used when AI is unavailable to ensure users always get a quote
 */
function generateFallbackQuote(input: InstantQuoteInput): InstantQuoteOutput {
  const volumeM3 = (input.length * input.width * input.height) / 1000000;
  const volumetricWeight = (input.length * input.width * input.height) / 5000;
  const chargeableWeight = Math.max(input.weight, volumetricWeight);
  
  // Estimate distance (simplified)
  const isLongDistance = input.origin.toLowerCase() !== input.destination.toLowerCase();
  const estimatedDistance = isLongDistance ? 200 : 30; // km estimate
  
  // Base rate calculation
  let baseRate = 5.00;
  let distanceCharge = estimatedDistance * 0.40;
  
  // Weight surcharge
  let weightSurcharge = 0;
  if (chargeableWeight > 30) weightSurcharge = 10 + (chargeableWeight - 30) * 0.30;
  else if (chargeableWeight > 15) weightSurcharge = 5;
  else if (chargeableWeight > 5) weightSurcharge = 2;
  
  // Volume surcharge
  let volumetricSurcharge = 0;
  if (volumeM3 > 1.0) volumetricSurcharge = 15;
  else if (volumeM3 > 0.5) volumetricSurcharge = 8;
  else if (volumeM3 > 0.1) volumetricSurcharge = 3;
  
  // Package type
  let handlingFee = 0;
  const packageType = input.packageType || 'standard';
  if (packageType === 'fragile') handlingFee = 5;
  else if (packageType === 'perishable') handlingFee = 8;
  else if (packageType === 'oversized') handlingFee = 12;
  else if (packageType === 'document') handlingFee = -2;
  
  // Urgency
  let urgencySurcharge = 0;
  const urgency = input.urgency || 'standard';
  if (urgency === 'express') urgencySurcharge = baseRate * 0.30;
  else if (urgency === 'same-day') urgencySurcharge = baseRate * 0.60;
  
  const insuranceFee = 2.00;
  
  const totalUSD = Math.max(3, 
    baseRate + distanceCharge + volumetricSurcharge + weightSurcharge + handlingFee + urgencySurcharge + insuranceFee
  );
  
  return {
    quoteKES: Math.round(totalUSD * 130),
    quoteUSD: Math.round(totalUSD * 100) / 100,
    breakdown: {
      baseRate: Math.round(baseRate * 100) / 100,
      distanceCharge: Math.round(distanceCharge * 100) / 100,
      volumetricSurcharge: Math.round(volumetricSurcharge * 100) / 100,
      weightSurcharge: Math.round(weightSurcharge * 100) / 100,
      handlingFee: Math.round(handlingFee * 100) / 100,
      urgencySurcharge: Math.round(urgencySurcharge * 100) / 100,
      insuranceFee,
    },
    estimatedDeliveryDays: urgency === 'same-day' ? 1 : urgency === 'express' ? 2 : 4,
    summary: `Shipping from ${input.origin} to ${input.destination} (${chargeableWeight.toFixed(1)} kg chargeable weight)`,
    recommendations: 'For accurate quotes, please contact our team with exact pickup and delivery addresses.',
  };
}

=======
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
>>>>>>> 62a311af5d8104f8c7ddde51d7976efdbe59aa3f
