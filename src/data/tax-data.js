// Tax Types Enum
export const TAX_TYPES = {
    FLAT_RATE: "flat_rate",       // Simple percentage
    PROGRESSIVE: "progressive",    // Bracket-based (like federal)
    SURTAX: "surtax",            // Additional tax on state tax
    FLAT_AMOUNT: "flat_amount",   // Fixed dollar amount
    TABLE_BASED: "table_based"    // Like Oregon's system
  };
  
  // Base State Tax Data
  export const STATE_TAX_DATA = {
    "Alabama": { rate: 0.05, hasLocalTax: false},
    "Alaska": { rate: 0, hasLocalTax: false },
    "Arizona": { rate: 0.025, hasLocalTax: false },
    "Arkansas": { rate: 0.039, hasLocalTax: false },
    "California": { rate: 0.133, hasLocalTax: false },
    "Colorado": { rate: 0.044, hasLocalTax: true, taxType: "city" },
    "Connecticut": { rate: 0.0699, hasLocalTax: false },
    "Delaware": { rate: 0.066, hasLocalTax: false},
    "Florida": { rate: 0, hasLocalTax: false },
    "Georgia": { rate: 0.0539, hasLocalTax: false },
    "Hawaii": { rate: 0.11, hasLocalTax: false },
    "Idaho": { rate: 0.05965, hasLocalTax: false },
    "Illinois": { rate: 0.049, hasLocalTax: false },
    "Indiana": { rate: 0.03, hasLocalTax: true, taxType: "county" },
    "Iowa": { rate: 0.038, hasLocalTax: true, taxType: "school_district" },
    "Kansas": { rate: 0.0558, hasLocalTax: false },
    "Kentucky": { rate: 0.04, hasLocalTax: true, taxType: "city" },
    "Louisiana": { rate: 0.03, hasLocalTax: false },
    "Maine": { rate: 0.0715, hasLocalTax: false },
    "Maryland": { rate: 0.0575, hasLocalTax: true, taxType: "county" },
    "Massachusetts": { rate: 0.09, hasLocalTax: false },
    "Michigan": { rate: 0.0425, hasLocalTax: true, taxType: "city" },
    "Minnesota": { rate: 0.0985, hasLocalTax: false },
    "Mississippi": { rate: 0.044, hasLocalTax: false },
    "Missouri": { rate: 0.047, hasLocalTax: true, taxType: "city" },
    "Montana": { rate: 0.059, hasLocalTax: false },
    "Nebraska": { rate: 0.052, hasLocalTax: false },
    "Nevada": { rate: 0, hasLocalTax: false },
    "New Hampshire": { rate: 0, hasLocalTax: false },
    "New Jersey": { rate: 0.1075, hasLocalTax: true, taxType: "city" },
    "New Mexico": { rate: 0.059, hasLocalTax: false },
    "New York": { rate: 0.109, hasLocalTax: true, taxType: "city", useProgressiveBrackets: true },
    "North Carolina": { rate: 0.0425, hasLocalTax: false },
    "North Dakota": { rate: 0.025, hasLocalTax: false },
    "Ohio": { rate: 0.035, hasLocalTax: true, taxType: "city" },
    "Oklahoma": { rate: 0.0475, hasLocalTax: false },
    "Oregon": { rate: 0.099, hasLocalTax: true, taxType: "table_based" },
    "Pennsylvania": { rate: 0.0307, hasLocalTax: true, taxType: "both" },
    "Rhode Island": { rate: 0.0599, hasLocalTax: false },
    "South Carolina": { rate: 0.062, hasLocalTax: false },
    "South Dakota": { rate: 0, hasLocalTax: false },
    "Tennessee": { rate: 0, hasLocalTax: false },
    "Texas": { rate: 0, hasLocalTax: false },
    "Utah": { rate: 0.0455, hasLocalTax: false },
    "Vermont": { rate: 0.0875, hasLocalTax: false },
    "Virginia": { rate: 0.0575, hasLocalTax: false },
    "Washington": { rate: 0.07, hasLocalTax: false },
    "West Virginia": { rate: 0.0482, hasLocalTax: true, taxType: "city" },
    "Wisconsin": { rate: 0.0765, hasLocalTax: false },
    "Wyoming": { rate: 0, hasLocalTax: false }
  };
  
  // Federal Tax Brackets
 // Define the federal tax brackets correctly with "limit" being the upper bound of each bracket
const FEDERAL_TAX_BRACKETS_2024 = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 }
];

// Calculate progressive tax (like federal income tax)
const calculateProgressiveTax = (income, brackets) => {
  let tax = 0;
  
  for (let i = 0; i < brackets.length; i++) {
    const currentBracket = brackets[i];
    
    // Calculate income in this bracket
    const bracketMin = currentBracket.min;
    const bracketMax = currentBracket.max;
    
    if (income > bracketMin) {
      // Calculate the portion of income that falls within this bracket
      const taxableInThisBracket = Math.min(income, bracketMax) - bracketMin;
      tax += taxableInThisBracket * currentBracket.rate;
    }
    
    // If we've processed all income, we can stop
    if (income <= bracketMax) break;
  }
  
  return tax;
};

// Example calculation for $58,000 income
function calculateExampleTax() {
  const income = 58000;
  const federalTax = calculateProgressiveTax(income, FEDERAL_TAX_BRACKETS_2024);
  
  console.log(`Federal tax on $${income.toFixed(2)}:`);
  
  // Show calculation breakdown
  let totalTax = 0;
  for (let i = 0; i < FEDERAL_TAX_BRACKETS_2024.length; i++) {
    const bracket = FEDERAL_TAX_BRACKETS_2024[i];
    if (income > bracket.min) {
      const taxableAmount = Math.min(income, bracket.max) - bracket.min;
      const taxInBracket = taxableAmount * bracket.rate;
      totalTax += taxInBracket;
      
      console.log(`${bracket.min.toLocaleString()} to ${Math.min(income, bracket.max).toLocaleString()}: ${taxableAmount.toLocaleString()} @ ${(bracket.rate * 100).toFixed(1)}% = $${taxInBracket.toFixed(2)}`);
    }
    
    if (income <= bracket.max) break;
  }
  
  console.log(`Total federal tax: $${totalTax.toFixed(2)}`);
  console.log(`Effective tax rate: ${((totalTax / income) * 100).toFixed(2)}%`);
  
  return federalTax;
}

calculateExampleTax(); 
  
  // FICA Tax Constants
  export const FICA_RATES = {
    socialSecurity: 0.062,  // 6.2%
    medicare: 0.0145,      // 1.45%
    additionalMedicare: 0.009, // 0.9% additional Medicare tax for high earners
    socialSecurityWageCap: 168600 // 2024 wage cap for Social Security tax
  };