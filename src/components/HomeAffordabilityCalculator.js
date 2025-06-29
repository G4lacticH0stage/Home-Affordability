import React, { useState, useEffect } from 'react';
import './HomeAffordabilityCalculator.css';
import { PROPERTY_TAX_RATES } from './data/propertyTaxRates';
import { INDIANA_COUNTIES } from './data/indianaTaxData';
import { MARYLAND_COUNTIES } from './data/marylandTaxData';
import { MICHIGAN_CITIES, calculateMichiganLocalTax } from './data/michiganTaxData';
import { MISSOURI_CITIES } from './data/missouriTaxData';
import { NEW_JERSEY_CITIES } from './data/newJerseyTaxData';
import { NEW_YORK_TAX, calculateNYTax } from './data/newYorkTaxData';
import { OHIO_MUNICIPALITIES } from './data/ohioTaxData';
import { OREGON_TAX } from './data/oregonTaxData';
import { PENNSYLVANIA_TAX } from './data/pennsylvaniaTaxData';
import { WEST_VIRGINIA_TAX } from './data/westVirginiaTaxData';
import { STATE_TAX_DATA } from './data/tax-data';

// Utility functions
const calculateMonthlyMortgage = (homePrice, downPayment, interestRate, loanTermYears) => {
  // Calculate loan amount
  const loanAmount = homePrice - downPayment;
  
  // Convert annual interest rate to monthly and decimal form
  const monthlyInterestRate = (interestRate / 100) / 12;
  
  // Calculate number of payments
  const numberOfPayments = loanTermYears * 12;
  
  // Avoid division by zero for 0% interest
  if (monthlyInterestRate === 0) {
    return loanAmount / numberOfPayments;
  }
  
  // Use mortgage payment formula: M = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
  const monthlyPayment = loanAmount * 
    (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
    (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
  
  return monthlyPayment;
};

// Calculate maximum home price based on gross income
const calculateMaxHomePrice = (monthlyGrossIncome, interestRate, loanTermYears, downPayment, monthlyDebts = 0) => {
  // Maximum payment based on whether there are debts included
  // If debts included, use 36% rule (minus debts), otherwise use 28% rule
  const maxMonthlyPaymentPercent = monthlyDebts > 0 ? 0.36 : 0.28;
  const maxMonthlyPayment = (monthlyGrossIncome * maxMonthlyPaymentPercent) - monthlyDebts;
  
  if (maxMonthlyPayment <= 0) return 0;
  
  // Convert annual interest rate to monthly
  const monthlyInterestRate = (interestRate / 100) / 12;
  
  // Number of payments
  const numberOfPayments = loanTermYears * 12;
  
  // Avoid division by zero for 0% interest
  if (monthlyInterestRate === 0) {
    const maxLoanAmount = maxMonthlyPayment * numberOfPayments;
    return maxLoanAmount + downPayment;
  }
  
  // Calculate maximum loan amount
  // Using formula: P = pmt * (1 - (1 + r)^-n) / r
  const maxLoanAmount = maxMonthlyPayment * 
    (1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments)) / 
    monthlyInterestRate;
  
  // Calculate max home price (loan amount + down payment)
  const maxHomePrice = maxLoanAmount + downPayment;
  
  return maxHomePrice;
};

// Format currency for display
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
};

// Format percentage for display
const formatPercentage = (value) => {
  return value.toFixed(1) + '%';
};

// Federal Tax Brackets 2024
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

// FICA rates
const FICA_RATES = {
  socialSecurity: 0.062,  // 6.2%
  medicare: 0.0145,      // 1.45%
  additionalMedicare: 0.009, // 0.9% additional Medicare tax for high earners
  socialSecurityWageCap: 168600 // 2024 wage cap for Social Security tax
};

// State tax rates (simplified)
const STATE_TAX_RATES = {
  "Alabama": 0.05,
  "Alaska": 0.00,
  "Arizona": 0.025,
  "Arkansas": 0.039,
  "California": 0.095,
  "Colorado": 0.044,
  "Connecticut": 0.0699,
  "Delaware": 0.066,
  "Florida": 0.00,
  "Georgia": 0.0539,
  "Hawaii": 0.11,
  "Idaho": 0.059,
  "Illinois": 0.049,
  "Indiana": 0.03,
  "Iowa": 0.038,
  "Kansas": 0.055,
  "Kentucky": 0.04,
  "Louisiana": 0.03,
  "Maine": 0.071,
  "Maryland": 0.057,
  "Massachusetts": 0.09,
  "Michigan": 0.042,
  "Minnesota": 0.098,
  "Mississippi": 0.044,
  "Missouri": 0.047,
  "Montana": 0.059,
  "Nebraska": 0.052,
  "Nevada": 0.00,
  "New Hampshire": 0.05,
  "New Jersey": 0.057,
  "New Mexico": 0.059,
  "New York": 0.065,
  "North Carolina": 0.0425,
  "North Dakota": 0.025,
  "Ohio": 0.035,
  "Oklahoma": 0.0475,
  "Oregon": 0.099,
  "Pennsylvania": 0.0307,
  "Rhode Island": 0.0599,
  "South Carolina": 0.062,
  "South Dakota": 0.00,
  "Tennessee": 0.00,
  "Texas": 0.00,
  "Utah": 0.0455,
  "Vermont": 0.0875,
  "Virginia": 0.0575,
  "Washington": 0.00,
  "West Virginia": 0.0482,
  "Wisconsin": 0.0765,
  "Wyoming": 0.00
};

// Default interest rates by term
const DEFAULT_INTEREST_RATES = {
  10: 5.84,
  15: 5.96,
  30: 6.5
};

// Convert various income types to annual
const convertToAnnualIncome = (income, payType) => {
  const numericIncome = parseFloat(income);
  
  if (isNaN(numericIncome)) return 0;
  
  switch (payType) {
    case 'hourly':
      return numericIncome * 40 * 52; // 40 hours per week, 52 weeks per year
    case 'weekly':
      return numericIncome * 52;
    case 'biweekly':
      return numericIncome * 26;
    case 'monthly':
      return numericIncome * 12;
    case 'annual':
    default:
      return numericIncome;
  }
};

// Calculate FICA taxes (Social Security and Medicare)
const calculateFICATax = (income) => {
  const { socialSecurity, medicare, additionalMedicare, socialSecurityWageCap } = FICA_RATES;
  
  // Social Security has a wage cap
  const socialSecurityTax = Math.min(income, socialSecurityWageCap) * socialSecurity;
  
  // Regular Medicare tax
  let medicareTax = income * medicare;
  
  // Additional Medicare tax for high earners (over $200,000)
  if (income > 200000) {
    medicareTax += (income - 200000) * additionalMedicare;
  }
  
  return {
    socialSecurity: socialSecurityTax,
    medicare: medicareTax,
    total: socialSecurityTax + medicareTax
  };
};

// Helper function to safely get tax rate value from different tax structures
const getTaxRateValue = (taxData) => {
  if (!taxData) return 0;
  
  if (taxData.type === "percentage" || taxData.type === "flat") {
    return taxData.value;
  } else if (taxData.type === "range") {
    return (taxData.min + taxData.max) / 2; // Use average of range
  } else if (taxData.type === "fixed") {
    return taxData.value;
  }
  
  return 0;
};

// Calculate local tax (city or county)
const calculateLocalTax = (income, state, city) => {
  if (!state || !city || !STATE_TAX_DATA[state] || !STATE_TAX_DATA[state].hasLocalTax) {
    return 0;
  }
  
  switch (state) {
    case 'Indiana':
      if (INDIANA_COUNTIES[city]) {
        return income * getTaxRateValue(INDIANA_COUNTIES[city]);
      }
      break;
    case 'Maryland':
      if (MARYLAND_COUNTIES[city]) {
        return income * getTaxRateValue(MARYLAND_COUNTIES[city]);
      }
      break;
    case 'Michigan':
      return calculateMichiganLocalTax(income, city);
    case 'Missouri':
      if (MISSOURI_CITIES[city]) {
        return income * getTaxRateValue(MISSOURI_CITIES[city]);
      }
      break;
    case 'New Jersey':
      if (NEW_JERSEY_CITIES[city]) {
        return income * getTaxRateValue(NEW_JERSEY_CITIES[city]);
      }
      break;
    case 'New York':
      if (NEW_YORK_TAX.cities[city]) {
        const taxResult = calculateNYTax(income, city);
        return taxResult.cityTax;
      }
      break;
    case 'Ohio':
      if (OHIO_MUNICIPALITIES[city]) {
        return income * getTaxRateValue(OHIO_MUNICIPALITIES[city]);
      }
      break;
    case 'Oregon':
      return OREGON_TAX.calculateTax(income).localTax;
    case 'Pennsylvania':
      if (PENNSYLVANIA_TAX.counties[city]) {
        const countyData = PENNSYLVANIA_TAX.counties[city];
        if (countyData.type === "fixed") {
          return income * countyData.value;
        } else if (countyData.type === "range") {
          return income * ((countyData.max + countyData.min) / 2);
        }
      }
      break;
    case 'West Virginia':
      if (WEST_VIRGINIA_TAX.cities[city]) {
        return WEST_VIRGINIA_TAX.calculateTax(city);
      }
      break;
  }
  
  return 0;
};

// Calculate federal tax
const calculateFederalTax = (income) => {
  return calculateProgressiveTax(income, FEDERAL_TAX_BRACKETS_2024);
};

// Calculate state tax (simplified)
const calculateStateTax = (income, state) => {
  if (!state || !STATE_TAX_RATES[state]) return 0;
  return income * STATE_TAX_RATES[state];
};

// Calculate total tax burden
const calculateTotalTax = (income, state) => {
  const federalTax = calculateFederalTax(income);
  const ficaTaxes = calculateFICATax(income);
  const stateTax = calculateStateTax(income, state);
  
  return {
    federal: federalTax,
    fica: ficaTaxes.total,
    ficaSocialSecurity: ficaTaxes.socialSecurity,
    ficaMedicare: ficaTaxes.medicare,
    state: stateTax,
    local: 0, // This will be calculated separately if local jurisdiction is provided
    total: federalTax + ficaTaxes.total + stateTax,
    effectiveRate: (federalTax + ficaTaxes.total + stateTax) / income
  };
};

// Get affordability color class based on income percentage and debt situation
const getAffordabilityColorClass = (percentage, hasDebts) => {
  if (hasDebts) {
    // Using 36% rule with debts
    if (percentage <= 36) return "green";
    if (percentage <= 42) return "yellow";
    return "red";
  } else {
    // Using 28% rule without debts
    if (percentage <= 28) return "green";
    if (percentage <= 32) return "yellow";
    return "red";
  }
};

const HomeAffordabilityCalculator = () => {
  // Income and tax state
  const [incomeData, setIncomeData] = useState({
    income: '',
    payType: 'annual',
    state: '',
    city: '',
    useCustomTakeHome: false,
    monthlyTakeHome: ''
  });

  // Housing state - Updated with property tax fields
  const [housingData, setHousingData] = useState({
    homePrice: '',
    downPaymentType: 'percent', // 'percent' or 'amount'
    downPaymentPercent: '20',
    downPaymentAmount: '',
    loanTermYears: '30',
    interestRate: '6.5',
    includePropertyTax: true,
    propertyTaxState: '',
    propertyTaxCounty: '',
    customPropertyTaxRate: '2.8', // Default 2.8% rate
    includeHomeInsurance: true,
    homeInsurance: '1200',
    enableFHA: false
  });

  // Additional financial details
  const [financialData, setFinancialData] = useState({
    monthlyDebts: ''
  });

  // Results and UI state
  const [errors, setErrors] = useState({});
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('what-can-i-afford');
  const [showDetailedResults, setShowDetailedResults] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [paymentsByTerm, setPaymentsByTerm] = useState(null);
  const [availablePropertyTaxCounties, setAvailablePropertyTaxCounties] = useState([]);

  // Calculate property tax rate based on state/county selection or use default
  const getPropertyTaxRate = () => {
    if (!housingData.propertyTaxState || !housingData.propertyTaxCounty) {
      // Use default 2.8% rate
      return parseFloat(housingData.customPropertyTaxRate) / 100;
    }
    
    const stateRates = PROPERTY_TAX_RATES[housingData.propertyTaxState];
    if (!stateRates) {
      return parseFloat(housingData.customPropertyTaxRate) / 100;
    }
    
    const countyRate = stateRates[housingData.propertyTaxCounty];
    if (!countyRate) {
      return parseFloat(housingData.customPropertyTaxRate) / 100;
    }
    
    return countyRate;
  };

  // Update available counties when property tax state changes
  useEffect(() => {
    if (housingData.propertyTaxState && PROPERTY_TAX_RATES[housingData.propertyTaxState]) {
      const counties = Object.keys(PROPERTY_TAX_RATES[housingData.propertyTaxState]);
      setAvailablePropertyTaxCounties(counties);
      setHousingData(prev => ({ ...prev, propertyTaxCounty: '' }));
    } else {
      setAvailablePropertyTaxCounties([]);
    }
  }, [housingData.propertyTaxState]);

  // Add city selection for local tax calculations
  const getJurisdictionsForState = (state) => {
    if (!state || !STATE_TAX_DATA[state] || !STATE_TAX_DATA[state].hasLocalTax) {
      return [];
    }
    
    switch (state) {
      case 'Indiana':
        return Object.keys(INDIANA_COUNTIES);
      case 'Maryland':
        return Object.keys(MARYLAND_COUNTIES);
      case 'Michigan':
        return [...Object.keys(MICHIGAN_CITIES.exceptions), 'Other'];
      case 'Missouri':
        return Object.keys(MISSOURI_CITIES);
      case 'New Jersey':
        return Object.keys(NEW_JERSEY_CITIES);
      case 'New York':
        return Object.keys(NEW_YORK_TAX.cities);
      case 'Ohio':
        return Object.keys(OHIO_MUNICIPALITIES);
      case 'Pennsylvania':
        return ['Philadelphia', ...Object.keys(PENNSYLVANIA_TAX.counties).slice(0, 10), 'Other'];
      case 'West Virginia':
        return Object.keys(WEST_VIRGINIA_TAX.cities), 'Other';
      default:
        return [];
    }
  };

  // Get jurisdiction label based on state
  const getJurisdictionLabel = (state) => {
    if (!state || !STATE_TAX_DATA[state]) return 'Municipality/City';
    
    const stateData = STATE_TAX_DATA[state];
    
    switch (stateData.taxType) {
      case 'county':
        return 'County';
      case 'city':
        return 'City/Municipality';
      case 'school_district':
        return 'School District';
      case 'both':
        return 'City/County';
      default:
        return 'Municipality/City';
    }
  };

  // Set interest rate based on loan term
  useEffect(() => {
    const term = parseInt(housingData.loanTermYears, 10);
    const defaultRate = DEFAULT_INTEREST_RATES[term] || DEFAULT_INTEREST_RATES[30];
    setHousingData(prev => ({ ...prev, interestRate: defaultRate.toString() }));
  }, [housingData.loanTermYears]);

  // Handle FHA toggle and set down payment to 3.5%
  useEffect(() => {
    if (housingData.enableFHA) {
      setHousingData(prev => ({
        ...prev,
        downPaymentPercent: '3.5'
      }));
    }
  }, [housingData.enableFHA]);

  // Calculate down payment amount when percent changes
  useEffect(() => {
    if (housingData.downPaymentType === 'percent' && housingData.homePrice) {
      const homePrice = parseFloat(housingData.homePrice);
      const percent = parseFloat(housingData.downPaymentPercent);
      if (!isNaN(homePrice) && !isNaN(percent)) {
        const amount = homePrice * (percent / 100);
        setHousingData(prev => ({ 
          ...prev, 
          downPaymentAmount: amount.toFixed(0)
        }));
      }
    }
  }, [housingData.downPaymentPercent, housingData.homePrice, housingData.downPaymentType]);

  // Calculate down payment percent when amount changes
  useEffect(() => {
    if (housingData.downPaymentType === 'amount' && housingData.homePrice) {
      const homePrice = parseFloat(housingData.homePrice);
      const amount = parseFloat(housingData.downPaymentAmount);
      if (!isNaN(homePrice) && !isNaN(amount) && homePrice > 0) {
        const percent = (amount / homePrice) * 100;
        setHousingData(prev => ({ 
          ...prev, 
          downPaymentPercent: percent.toFixed(1)
        }));
      }
    }
  }, [housingData.downPaymentAmount, housingData.homePrice, housingData.downPaymentType]);

  // Handle changes to income data
  const handleIncomeChange = (field, value) => {
    setIncomeData(prev => {
      // If changing state, reset city
      if (field === 'state') {
        return { ...prev, [field]: value, city: '' };
      }
      return { ...prev, [field]: value };
    });
  };

  // Handle changes to housing data
  const handleHousingChange = (field, value) => {
    setHousingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle changes to financial data
  const handleFinancialChange = (field, value) => {
    setFinancialData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Switch between percentage and amount for down payment
  const handleDownPaymentTypeChange = (type) => {
    setHousingData(prev => ({
      ...prev,
      downPaymentType: type
    }));
  };

  // Validate the input form
  const validateForm = () => {
    const newErrors = {};

    if (!incomeData.useCustomTakeHome) {
      // Validate income inputs
      if (!incomeData.income) {
        newErrors.income = 'Income is required';
      } else if (isNaN(parseFloat(incomeData.income)) || parseFloat(incomeData.income) <= 0) {
        newErrors.income = 'Please enter a valid income amount';
      }

      if (!incomeData.state) {
        newErrors.state = 'State selection is required for tax calculation';
      }
      
      // Validate city selection if state has local taxes
      if (incomeData.state && STATE_TAX_DATA[incomeData.state] && 
          STATE_TAX_DATA[incomeData.state].hasLocalTax && !incomeData.city) {
        newErrors.city = `${getJurisdictionLabel(incomeData.state)} selection is required for accurate tax calculation`;
      }
    } else {
      // Validate custom take-home pay
      if (!incomeData.monthlyTakeHome) {
        newErrors.monthlyTakeHome = 'Monthly take-home pay is required';
      } else if (isNaN(parseFloat(incomeData.monthlyTakeHome)) || parseFloat(incomeData.monthlyTakeHome) <= 0) {
        newErrors.monthlyTakeHome = 'Please enter a valid monthly take-home amount';
      }
    }

    // If we're analyzing a specific home, validate home price
    if (activeTab === 'analyze-mortgage' && !housingData.homePrice) {
      newErrors.homePrice = 'Home price is required';
    } else if (activeTab === 'analyze-mortgage' && (isNaN(parseFloat(housingData.homePrice)) || parseFloat(housingData.homePrice) <= 0)) {
      newErrors.homePrice = 'Please enter a valid home price';
    }

    // Validate down payment
    if (housingData.downPaymentType === 'percent') {
      if (!housingData.downPaymentPercent || isNaN(parseFloat(housingData.downPaymentPercent)) || 
          parseFloat(housingData.downPaymentPercent) < 0 || parseFloat(housingData.downPaymentPercent) > 100) {
        newErrors.downPaymentPercent = 'Down payment must be between 0% and 100%';
      }
    } else {
      if (!housingData.downPaymentAmount || isNaN(parseFloat(housingData.downPaymentAmount)) || parseFloat(housingData.downPaymentAmount) < 0) {
        newErrors.downPaymentAmount = 'Please enter a valid down payment amount';
      }
    }

    // Validate interest rate
    if (!housingData.interestRate || isNaN(parseFloat(housingData.interestRate)) || parseFloat(housingData.interestRate) < 0) {
      newErrors.interestRate = 'Please enter a valid interest rate';
    }

    // Validate optional financial data
    if (financialData.monthlyDebts && (isNaN(parseFloat(financialData.monthlyDebts)) || parseFloat(financialData.monthlyDebts) < 0)) {
      newErrors.monthlyDebts = 'Please enter a valid monthly debt amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate affordability (what can I afford)
  const calculateAffordability = () => {
    if (!validateForm()) return;

    try {
      let annualIncome = 0;
      let monthlyGrossIncome = 0;
      let monthlyTakeHome = 0;
      let taxResults = { total: 0, federal: 0, fica: 0, state: 0, local: 0, effectiveRate: 0 };
      
      // Calculate gross income and taxes
      if (!incomeData.useCustomTakeHome) {
        // Convert to annual income and calculate taxes
        annualIncome = convertToAnnualIncome(incomeData.income, incomeData.payType);
        // Use local tax data if available
        if (incomeData.city && STATE_TAX_DATA[incomeData.state] && STATE_TAX_DATA[incomeData.state].hasLocalTax) {
          // Calculate local tax
          const localTax = calculateLocalTax(annualIncome, incomeData.state, incomeData.city);
          taxResults = calculateTotalTax(annualIncome, incomeData.state);
          taxResults.local = localTax;
          taxResults.total += localTax;
        } else {
          taxResults = calculateTotalTax(annualIncome, incomeData.state);
        }
        monthlyGrossIncome = annualIncome / 12;
        const takeHomePay = annualIncome - taxResults.total;
        monthlyTakeHome = takeHomePay / 12;
      } else {
        // Use custom take-home pay
        monthlyTakeHome = parseFloat(incomeData.monthlyTakeHome);
        // Estimate gross income based on take-home pay
        monthlyGrossIncome = monthlyTakeHome * 1.3;
        annualIncome = monthlyGrossIncome * 12;
      }

      // Parse other inputs
      const monthlyDebts = parseFloat(financialData.monthlyDebts) || 0;
      const hasDebts = monthlyDebts > 0;
      const interestRate = parseFloat(housingData.interestRate) || DEFAULT_INTEREST_RATES[30];
      const loanTermYears = parseInt(housingData.loanTermYears, 10);
      
      // Determine down payment based on type
      let downPaymentPercent, downPaymentAmount;
      if (housingData.downPaymentType === 'percent') {
        downPaymentPercent = parseFloat(housingData.downPaymentPercent);
        // Will calculate actual amount after we know max home price
      } else {
        downPaymentAmount = parseFloat(housingData.downPaymentAmount);
        // Will use this fixed amount
      }
      
      // Calculate affordability ratios
      // Front-end ratio: 28% of monthly gross income for housing (PITI)
      const frontEndMaxPayment = monthlyGrossIncome * 0.28;
      // Back-end ratio: 36% of monthly gross income for all debt payments
      const backEndMaxPayment = (monthlyGrossIncome * 0.36) - monthlyDebts;
      // Use the more conservative of the two
      const maxMonthlyPayment = Math.min(frontEndMaxPayment, backEndMaxPayment);
      
      // Adjust for property tax and insurance
      let additionalHousingCosts = 0;
      
      if (housingData.includePropertyTax) {
        const propertyTaxRate = getPropertyTaxRate();
        // Will estimate with a placeholder value for now
        additionalHousingCosts += (300000 * propertyTaxRate) / 12; // Placeholder home value
      }
      
      if (housingData.includeHomeInsurance) {
        const annualInsurance = parseFloat(housingData.homeInsurance) || 1200;
        additionalHousingCosts += annualInsurance / 12;
      }
      
      // Add MIP if FHA loan is enabled
      if (housingData.enableFHA) {
        // FHA MIP is typically 0.85% annually for loans over 90% LTV
        const estimatedHomePrice = 300000; // Placeholder for calculation
        const monthlyMIP = (estimatedHomePrice * 0.0085) / 12;
        additionalHousingCosts += monthlyMIP;
      }
      
      // Adjust max payment to account for property tax and insurance
      const maxPIPayment = maxMonthlyPayment - additionalHousingCosts;
      
      if (maxPIPayment <= 0) {
        setErrors({ 
          general: 'Your expenses and debts are too high relative to your income for a mortgage'
        });
        return;
      }
      
      // Calculate max home price based on the down payment situation
      let maxHomePrice, maxLoanAmount;
      
      if (housingData.downPaymentType === 'percent') {
        // Percentage-based down payment
        maxHomePrice = calculateMaxHomePrice(
          monthlyGrossIncome,
          interestRate,
          loanTermYears,
          0, // Temporarily use 0 for down payment
          monthlyDebts
        );
        
        // Now apply the down payment percentage
        downPaymentAmount = maxHomePrice * (downPaymentPercent / 100);
        maxLoanAmount = maxHomePrice - downPaymentAmount;
      } else {
        // Fixed amount down payment
        // For fixed down payment, we need to calculate differently
        const fixedDownPayment = parseFloat(housingData.downPaymentAmount);
        
        // Calculate max loan amount first
        const maxLoanPayment = maxPIPayment;
        const monthlyInterestRate = (interestRate / 100) / 12;
        const numberOfPayments = loanTermYears * 12;
        
        if (monthlyInterestRate === 0) {
          maxLoanAmount = maxLoanPayment * numberOfPayments;
        } else {
          maxLoanAmount = maxLoanPayment * 
            (1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments)) / 
            monthlyInterestRate;
        }
        
        // Then calculate max home price by adding fixed down payment
        maxHomePrice = maxLoanAmount + fixedDownPayment;
        downPaymentAmount = fixedDownPayment;
        downPaymentPercent = (fixedDownPayment / maxHomePrice) * 100;
      }
      
      // Calculate monthly mortgage payment
      const baseMonthlyPayment = calculateMonthlyMortgage(
        maxHomePrice,
        downPaymentAmount,
        interestRate,
        loanTermYears
      );
      
      // Calculate more precise property tax and insurance now that we know max home price
      let totalMonthlyPayment = baseMonthlyPayment;
      let monthlyPropertyTax = 0;
      let monthlyInsurance = 0;
      let monthlyMIP = 0;
      
      if (housingData.includePropertyTax) {
        const propertyTaxRate = getPropertyTaxRate();
        monthlyPropertyTax = (maxHomePrice * propertyTaxRate) / 12;
        totalMonthlyPayment += monthlyPropertyTax;
      }
      
      if (housingData.includeHomeInsurance) {
        const annualInsurance = parseFloat(housingData.homeInsurance) || 1200;
        monthlyInsurance = annualInsurance / 12;
        totalMonthlyPayment += monthlyInsurance;
      }
      
      // Add MIP for FHA loans
      if (housingData.enableFHA) {
        monthlyMIP = (maxHomePrice * 0.0085) / 12;
        totalMonthlyPayment += monthlyMIP;
      }
      
      // Calculate payment options for different terms
      const termOptions = [10, 15, 30];
      const paymentOptions = {};
      
      termOptions.forEach(term => {
        const termInterestRate = DEFAULT_INTEREST_RATES[term] || DEFAULT_INTEREST_RATES[30];
        
        const termPayment = calculateMonthlyMortgage(
          maxHomePrice,
          downPaymentAmount,
          termInterestRate,
          term
        );
        
        let totalTermPayment = termPayment;
        
        if (housingData.includePropertyTax) {
          totalTermPayment += monthlyPropertyTax;
        }
        
        if (housingData.includeHomeInsurance) {
          totalTermPayment += monthlyInsurance;
        }
        
        if (housingData.enableFHA) {
          totalTermPayment += monthlyMIP;
        }
        
        // Calculate total interest paid over loan term
        const totalInterest = (termPayment * term * 12) - (maxHomePrice - downPaymentAmount);
        
        // Calculate percentage of gross income
        const percentOfGrossIncome = (totalTermPayment / monthlyGrossIncome) * 100;
        
        // Calculate percentage of take-home income
        const percentOfTakeHomeIncome = (totalTermPayment / monthlyTakeHome) * 100;
        
        // Determine affordability class
        const affordabilityClass = getAffordabilityColorClass(percentOfGrossIncome, hasDebts);
        
        paymentOptions[term] = {
          interestRate: termInterestRate,
          payment: termPayment,
          totalPayment: totalTermPayment,
          totalInterest: totalInterest,
          percentOfGrossIncome: percentOfGrossIncome,
          percentOfTakeHomeIncome: percentOfTakeHomeIncome,
          affordabilityClass: affordabilityClass
        };
      });
      
      // Calculate percentage of gross income
      const percentOfGrossIncome = (totalMonthlyPayment / monthlyGrossIncome) * 100;
      
      // Calculate percentage of take-home income
      const percentOfTakeHomeIncome = (totalMonthlyPayment / monthlyTakeHome) * 100;
      
      // Determine affordability class (color coding)
      const affordabilityClass = getAffordabilityColorClass(percentOfGrossIncome, hasDebts);
      
      // Set results for display
      setResults({
        annualIncome: annualIncome,
        monthlyGrossIncome: monthlyGrossIncome,
        monthlyTakeHome: monthlyTakeHome,
        maxHomePrice: maxHomePrice,
        maxLoanAmount: maxLoanAmount,
        downPaymentAmount: downPaymentAmount,
        downPaymentPercent: downPaymentPercent,
        baseMonthlyPayment: baseMonthlyPayment,
        monthlyPropertyTax: monthlyPropertyTax,
        monthlyInsurance: monthlyInsurance,
        monthlyMIP: monthlyMIP,
        totalMonthlyPayment: totalMonthlyPayment,
        percentOfGrossIncome: percentOfGrossIncome,
        percentOfTakeHomeIncome: percentOfTakeHomeIncome,
        affordabilityClass: affordabilityClass,
        taxResults: taxResults,
        enableFHA: housingData.enableFHA,
        propertyTaxRate: getPropertyTaxRate()
      });
      
      // Set payment options by term
      setPaymentsByTerm(paymentOptions);
      
    } catch (error) {
      console.error("Calculation error:", error);
      setErrors({ general: 'An error occurred during calculations. Please check your inputs.' });
    }
  };
  
  // Calculate affordability for a specific home price
  const analyzeMortgage = () => {
    if (!validateForm()) return;
    
    try {
      let annualIncome = 0;
      let monthlyGrossIncome = 0;
      let monthlyTakeHome = 0;
      let taxResults = { total: 0, federal: 0, fica: 0, state: 0, local: 0, effectiveRate: 0 };
      
      // Calculate gross income and taxes
      if (!incomeData.useCustomTakeHome) {
        // Convert to annual income and calculate taxes
        annualIncome = convertToAnnualIncome(incomeData.income, incomeData.payType);
        // Use local tax data if available
        if (incomeData.city && STATE_TAX_DATA[incomeData.state] && STATE_TAX_DATA[incomeData.state].hasLocalTax) {
          // Calculate local tax
          const localTax = calculateLocalTax(annualIncome, incomeData.state, incomeData.city);
          taxResults = calculateTotalTax(annualIncome, incomeData.state);
          taxResults.local = localTax;
          taxResults.total += localTax;
        } else {
          taxResults = calculateTotalTax(annualIncome, incomeData.state);
        }
        monthlyGrossIncome = annualIncome / 12;
        const takeHomePay = annualIncome - taxResults.total;
        monthlyTakeHome = takeHomePay / 12;
      } else {
        // Use custom take-home pay
        monthlyTakeHome = parseFloat(incomeData.monthlyTakeHome);
        // Estimate gross income based on take-home pay
        monthlyGrossIncome = monthlyTakeHome * 1.3;
        annualIncome = monthlyGrossIncome * 12;
      }
      
      // Parse inputs for the specified home
      const homePrice = parseFloat(housingData.homePrice);
      const monthlyDebts = parseFloat(financialData.monthlyDebts) || 0;
      const hasDebts = monthlyDebts > 0;
      const interestRate = parseFloat(housingData.interestRate) || DEFAULT_INTEREST_RATES[30];
      const loanTermYears = parseInt(housingData.loanTermYears, 10);
      
      // Calculate down payment
      let downPaymentAmount, downPaymentPercent;
      if (housingData.downPaymentType === 'percent') {
        downPaymentPercent = parseFloat(housingData.downPaymentPercent);
        downPaymentAmount = homePrice * (downPaymentPercent / 100);
      } else {
        downPaymentAmount = parseFloat(housingData.downPaymentAmount);
        downPaymentPercent = (downPaymentAmount / homePrice) * 100;
      }
      
      // Calculate loan amount
      const loanAmount = homePrice - downPaymentAmount;
      
      // Calculate monthly mortgage payment
      const baseMonthlyPayment = calculateMonthlyMortgage(
        homePrice,
        downPaymentAmount,
        interestRate,
        loanTermYears
      );
      
      // Calculate property tax and insurance
      let totalMonthlyPayment = baseMonthlyPayment;
      let monthlyPropertyTax = 0;
      let monthlyInsurance = 0;
      let monthlyMIP = 0;
      
      if (housingData.includePropertyTax) {
        const propertyTaxRate = getPropertyTaxRate();
        monthlyPropertyTax = (homePrice * propertyTaxRate) / 12;
        totalMonthlyPayment += monthlyPropertyTax;
      }
      
      if (housingData.includeHomeInsurance) {
        const annualInsurance = parseFloat(housingData.homeInsurance) || 1200;
        monthlyInsurance = annualInsurance / 12;
        totalMonthlyPayment += monthlyInsurance;
      }
      
      // Add MIP for FHA loans
      if (housingData.enableFHA) {
        monthlyMIP = (homePrice * 0.0085) / 12;
        totalMonthlyPayment += monthlyMIP;
      }
      
      // Calculate percentage of gross income
      const percentOfGrossIncome = (totalMonthlyPayment / monthlyGrossIncome) * 100;
      
      // Calculate percentage of take-home income
      const percentOfTakeHomeIncome = (totalMonthlyPayment / monthlyTakeHome) * 100;
      
      // Determine affordability using standard rules
      let isAffordable = false;
      if (hasDebts) {
        // If they have other debts, use back-end ratio (36% rule)
        const totalMonthlyDebtPayments = totalMonthlyPayment + monthlyDebts;
        const backEndRatio = (totalMonthlyDebtPayments / monthlyGrossIncome) * 100;
        isAffordable = backEndRatio <= 36;
      } else {
        // Otherwise use front-end ratio (28% rule)
        isAffordable = percentOfGrossIncome <= 28;
      }
      
      // Determine affordability class (color coding)
      const affordabilityClass = getAffordabilityColorClass(percentOfGrossIncome, hasDebts);
      
      // Calculate payment options for different terms
      const termOptions = [10, 15, 30];
      const paymentOptions = {};
      
      termOptions.forEach(term => {
        const termInterestRate = DEFAULT_INTEREST_RATES[term] || DEFAULT_INTEREST_RATES[30];
        
        const termPayment = calculateMonthlyMortgage(
          homePrice,
          downPaymentAmount,
          termInterestRate,
          term
        );
        
        let totalTermPayment = termPayment;
        
        if (housingData.includePropertyTax) {
          totalTermPayment += monthlyPropertyTax;
        }
        
        if (housingData.includeHomeInsurance) {
          totalTermPayment += monthlyInsurance;
        }
        
        if (housingData.enableFHA) {
          totalTermPayment += monthlyMIP;
        }
        
        // Calculate total interest paid over loan term
        const totalInterest = (termPayment * term * 12) - (homePrice - downPaymentAmount);
        
        // Calculate percentage of gross income
        const percentOfGrossIncome = (totalTermPayment / monthlyGrossIncome) * 100;
        
        // Calculate percentage of take-home income
        const percentOfTakeHomeIncome = (totalTermPayment / monthlyTakeHome) * 100;
        
        // Determine affordability class
        const affordabilityClass = getAffordabilityColorClass(percentOfGrossIncome, hasDebts);
        
        paymentOptions[term] = {
          interestRate: termInterestRate,
          payment: termPayment,
          totalPayment: totalTermPayment,
          totalInterest: totalInterest,
          percentOfGrossIncome: percentOfGrossIncome,
          percentOfTakeHomeIncome: percentOfTakeHomeIncome,
          affordabilityClass: affordabilityClass
        };
      });
      
      // Set results for display
      setResults({
        annualIncome: annualIncome,
        monthlyGrossIncome: monthlyGrossIncome,
        monthlyTakeHome: monthlyTakeHome,
        homePrice: homePrice,
        loanAmount: loanAmount,
        downPaymentAmount: downPaymentAmount,
        downPaymentPercent: downPaymentPercent,
        baseMonthlyPayment: baseMonthlyPayment,
        monthlyPropertyTax: monthlyPropertyTax,
        monthlyInsurance: monthlyInsurance,
        monthlyMIP: monthlyMIP,
        totalMonthlyPayment: totalMonthlyPayment,
        percentOfGrossIncome: percentOfGrossIncome,
        percentOfTakeHomeIncome: percentOfTakeHomeIncome,
        affordabilityClass: affordabilityClass,
        isAffordable: isAffordable,
        taxResults: taxResults,
        enableFHA: housingData.enableFHA,
        propertyTaxRate: getPropertyTaxRate()
      });
      
      // Set payment options by term
      setPaymentsByTerm(paymentOptions);
      
    } catch (error) {
      console.error("Calculation error:", error);
      setErrors({ general: 'An error occurred during calculations. Please check your inputs.' });
    }
  };
  
  // Handle calculation based on active tab
  const handleCalculate = () => {
    if (activeTab === 'what-can-i-afford') {
      calculateAffordability();
    } else {
      analyzeMortgage();
    }
  };
  
  return (
    <div className="calculator-container">
      <div className="calculator-header">
        <div className="tab-navigation">
          <button 
            className={`tab-button ${activeTab === 'what-can-i-afford' ? 'active' : ''}`}
            onClick={() => setActiveTab('what-can-i-afford')}
          >
            What Can I Afford?
          </button>
          <button 
            className={`tab-button ${activeTab === 'analyze-mortgage' ? 'active' : ''}`}
            onClick={() => setActiveTab('analyze-mortgage')}
          >
            Analyze Mortgage
          </button>
        </div>
      </div>
      
      <div className="calculator-body" style={{ display: 'flex', flexDirection: 'row' }}>
        {/* Left Column - Inputs */}
        <div className="calculator-inputs" style={{ flex: '1', marginRight: '20px' }}>
          {/* Income & Location Section */}
          <div className="input-section">
            <h2>Income & Location</h2>
            
            <div className="input-row">
              <div className="input-group">
                <label>Income Amount</label>
                <input
                  type="number"
                  value={incomeData.income}
                  onChange={(e) => handleIncomeChange('income', e.target.value)}
                  placeholder="Enter income"
                  disabled={incomeData.useCustomTakeHome}
                  className={errors.income ? 'error' : ''}
                />
                {errors.income && <div className="error-message">{errors.income}</div>}
              </div>
              
              <div className="input-group">
                <label>Pay Frequency</label>
                <select
                  value={incomeData.payType}
                  onChange={(e) => handleIncomeChange('payType', e.target.value)}
                  disabled={incomeData.useCustomTakeHome}
                >
                  <option value="hourly">Hourly</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
            </div>
            
            <div className="input-row">
              <div className="input-group">
                <label>State</label>
                <select
                  value={incomeData.state}
                  onChange={(e) => handleIncomeChange('state', e.target.value)}
                  disabled={incomeData.useCustomTakeHome}
                  className={errors.state ? 'error' : ''}
                >
                  <option value="">Select State</option>
                  {Object.keys(STATE_TAX_RATES).map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                {errors.state && <div className="error-message">{errors.state}</div>}
              </div>
              
              {incomeData.state && STATE_TAX_DATA[incomeData.state] && STATE_TAX_DATA[incomeData.state].hasLocalTax && (
                <div className="input-group">
                  <label>{getJurisdictionLabel(incomeData.state)}</label>
                  <select
                    value={incomeData.city}
                    onChange={(e) => handleIncomeChange('city', e.target.value)}
                    disabled={incomeData.useCustomTakeHome}
                    className={errors.city ? 'error' : ''}
                  >
                    <option value="">Select {getJurisdictionLabel(incomeData.state)}</option>
                    {getJurisdictionsForState(incomeData.state).map(jurisdiction => (
                      <option key={jurisdiction} value={jurisdiction}>{jurisdiction}</option>
                    ))}
                  </select>
                  {errors.city && <div className="error-message">{errors.city}</div>}
                </div>
              )}
            </div>
            
            <div className="input-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={incomeData.useCustomTakeHome}
                  onChange={(e) => handleIncomeChange('useCustomTakeHome', e.target.checked)}
                />
                I know my monthly take-home pay
              </label>
            </div>
            
            {incomeData.useCustomTakeHome && (
              <div className="input-group">
                <label>Monthly Take-Home Pay</label>
                <input
                  type="number"
                  value={incomeData.monthlyTakeHome}
                  onChange={(e) => handleIncomeChange('monthlyTakeHome', e.target.value)}
                  placeholder="Enter monthly take-home pay"
                  className={errors.monthlyTakeHome ? 'error' : ''}
                />
                {errors.monthlyTakeHome && <div className="error-message">{errors.monthlyTakeHome}</div>}
              </div>
            )}
          </div>
          
          {/* Home Details Section */}
          <div className="input-section">
            <h2>Home Details</h2>
            
            {activeTab === 'analyze-mortgage' && (
              <div className="input-group">
                <label>Home Price</label>
                <input
                  type="number"
                  value={housingData.homePrice}
                  onChange={(e) => handleHousingChange('homePrice', e.target.value)}
                  placeholder="Enter home price"
                  className={errors.homePrice ? 'error' : ''}
                />
                {errors.homePrice && <div className="error-message">{errors.homePrice}</div>}
              </div>
            )}
            
            <div className="input-row">
              <div className="input-group">
                <label>Down Payment</label>
                <div className="toggle-input-group">
                  <div className="toggle-buttons">
                    <button
                      type="button"
                      className={`toggle-button ${housingData.downPaymentType === 'percent' ? 'active' : ''}`}
                      onClick={() => handleDownPaymentTypeChange('percent')}
                    >
                      %
                    </button>
                    <button
                      type="button"
                      className={`toggle-button ${housingData.downPaymentType === 'amount' ? 'active' : ''}`}
                      onClick={() => handleDownPaymentTypeChange('amount')}
                    >
                      $
                    </button>
                  </div>
                  
                  {housingData.downPaymentType === 'percent' ? (
                    <input
                      type="number"
                      value={housingData.downPaymentPercent}
                      onChange={(e) => handleHousingChange('downPaymentPercent', e.target.value)}
                      placeholder="Enter percentage"
                      className={errors.downPaymentPercent ? 'error' : ''}
                      disabled={housingData.enableFHA}
                    />
                  ) : (
                    <input
                      type="number"
                      value={housingData.downPaymentAmount}
                      onChange={(e) => handleHousingChange('downPaymentAmount', e.target.value)}
                      placeholder="Enter amount"
                      className={errors.downPaymentAmount ? 'error' : ''}
                    />
                  )}
                </div>
                {errors.downPaymentPercent && <div className="error-message">{errors.downPaymentPercent}</div>}
                {errors.downPaymentAmount && <div className="error-message">{errors.downPaymentAmount}</div>}
              </div>
              
              <div className="input-group">
                <label>Loan Term</label>
                <select
                  value={housingData.loanTermYears}
                  onChange={(e) => handleHousingChange('loanTermYears', e.target.value)}
                >
                  <option value="10">10 years</option>
                  <option value="15">15 years</option>
                  <option value="30">30 years</option>
                </select>
              </div>
            </div>
            
            <div className="input-row">
              <div className="input-group">
                <label>Interest Rate (%)</label>
                <input
                  type="number"
                  value={housingData.interestRate}
                  onChange={(e) => handleHousingChange('interestRate', e.target.value)}
                  step="0.01"
                  min="0"
                  max="15"
                  className={errors.interestRate ? 'error' : ''}
                />
                {errors.interestRate && <div className="error-message">{errors.interestRate}</div>}
              </div>
            </div>
            
            {/* FHA Loan Toggle */}
            <div className="input-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={housingData.enableFHA}
                  onChange={(e) => handleHousingChange('enableFHA', e.target.checked)}
                />
                FHA Loan (3.5% down payment + MIP)
              </label>
            </div>
            
            <div className="toggle-section">
              <button
                type="button"
                className="toggle-advanced-btn"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              >
                {showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}
              </button>
              
              {showAdvancedOptions && (
                <div className="advanced-options">
                  <div className="input-toggle">
                    <label>
                      <input
                        type="checkbox"
                        checked={housingData.includePropertyTax}
                        onChange={(e) => handleHousingChange('includePropertyTax', e.target.checked)}
                      />
                      Include Property Tax
                    </label>
                  </div>
                  
                  {housingData.includePropertyTax && (
                    <div className="property-tax-section">
                      <div className="input-group">
                        <label>Property Tax State (optional)</label>
                        <select
                          value={housingData.propertyTaxState}
                          onChange={(e) => handleHousingChange('propertyTaxState', e.target.value)}
                        >
                          <option value="">Select State</option>
                          {Object.keys(PROPERTY_TAX_RATES).map(state => (
                            <option key={state} value={state}>{state}</option>
                          ))}
                        </select>
                      </div>
                      
                      {housingData.propertyTaxState && availablePropertyTaxCounties.length > 0 && (
                        <div className="input-group">
                          <label>Property Tax County</label>
                          <select
                            value={housingData.propertyTaxCounty}
                            onChange={(e) => handleHousingChange('propertyTaxCounty', e.target.value)}
                          >
                            <option value="">Select County</option>
                            {availablePropertyTaxCounties.map(county => (
                              <option key={county} value={county}>{county}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      
                      <div className="input-group">
                        <label>Property Tax Rate (%/year)</label>
                        <input
                          type="number"
                          value={housingData.customPropertyTaxRate}
                          onChange={(e) => handleHousingChange('customPropertyTaxRate', e.target.value)}
                          step="0.01"
                          min="0"
                          placeholder="Default: 2.8%"
                        />
                        <small>
                          Current rate: {(getPropertyTaxRate() * 100).toFixed(3)}%
                          {housingData.propertyTaxState && housingData.propertyTaxCounty 
                            ? ` (${housingData.propertyTaxCounty}, ${housingData.propertyTaxState})`
                            : ' (default)'
                          }
                        </small>
                      </div>
                    </div>
                  )}
                  
                  <div className="input-toggle">
                    <label>
                      <input
                        type="checkbox"
                        checked={housingData.includeHomeInsurance}
                        onChange={(e) => handleHousingChange('includeHomeInsurance', e.target.checked)}
                      />
                      Include Home Insurance
                    </label>
                  </div>
                  
                  {housingData.includeHomeInsurance && (
                    <div className="input-group">
                      <label>Annual Home Insurance ($)</label>
                      <input
                        type="number"
                        value={housingData.homeInsurance}
                        onChange={(e) => handleHousingChange('homeInsurance', e.target.value)}
                        min="0"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Additional Financial Details */}
          <div className="input-section">
            <h2>Additional Financial Details</h2>
            
            <div className="input-group">
              <label>Monthly Debt Payments</label>
              <input
                type="number"
                value={financialData.monthlyDebts}
                onChange={(e) => handleFinancialChange('monthlyDebts', e.target.value)}
                placeholder="Car loans, credit cards, etc."
                className={errors.monthlyDebts ? 'error' : ''}
              />
              {errors.monthlyDebts && <div className="error-message">{errors.monthlyDebts}</div>}
            </div>
          </div>
          
          {/* Error message and calculate button */}
          {errors.general && (
            <div className="error-message general-error">{errors.general}</div>
          )}
          
          <button 
            className="calculate-btn"
            onClick={handleCalculate}
          >
            Calculate
          </button>
        </div>

        {/* Right Column - Results */}
        <div className="calculator-results" style={{ flex: '1', marginLeft: '20px' }}>
          {results ? (
            <div className="results">
              <h2>Results Summary</h2>

              {/* Only show mortgage impact section in "Analyze Mortgage" tab when home price is provided */}
              {activeTab === 'analyze-mortgage' && results && results.homePrice && (
                <div className="affordability-visual">
                  <h3>Mortgage Impact on Monthly Budget</h3>
                  <div className="affordability-meter">
                    <div className="meter-header">
                      <span>Monthly Gross Income: {formatCurrency(results.monthlyGrossIncome)}</span>
                      <span className={results.affordabilityClass}>
                        {results.percentOfGrossIncome.toFixed(1)}% of Gross Income
                      </span>
                    </div>
                    <div className="meter-header">
                      <span>Monthly Take-Home: {formatCurrency(results.monthlyTakeHome)}</span>
                      <span className={results.affordabilityClass}>
                        {results.percentOfTakeHomeIncome.toFixed(1)}% of Take-Home Pay
                      </span>
                    </div>
                    <div className="meter-bar">
                      <div 
                        className={`meter-fill ${results.affordabilityClass}`} 
                        style={{width: `${Math.min(results.percentOfGrossIncome * 2, 100)}%`}}
                      ></div>
                    </div>
                    <div className="meter-labels">
                      <span>0%</span>
                      <span>28%</span>
                      <span>32%</span>
                      <span>50%</span>
                    </div>
                    <div className={`affordability-message ${results.affordabilityClass}`}>
                      {results.affordabilityClass === "green" ? (
                        "You are well within budget, you should be proud!"
                      ) : results.affordabilityClass === "yellow" ? (
                        "This house is a little outside of your budget. It is manageable, but you'll need to be more conscious about spending."
                      ) : (
                        "This house is outside of your budget. Maybe another home will be more suitable, but if your heart is set on this one be sure to cut expenses elsewhere."
                      )}
                    </div> 
                  </div>
                </div>
              )}

              {/* Affordability Summary - Updated for analyze mortgage tab */}
              <div className="result-summary">
                {activeTab === 'what-can-i-afford' ? (
                  <>
                    <div className="result-item total">
                      <span>Maximum Home Price:</span>
                      <span className="highlight">
                        {formatCurrency(results.maxHomePrice)}
                      </span>
                    </div>

                    <div className="result-row">
                      <div className="result-item">
                        <span>Down Payment ({results.downPaymentPercent.toFixed(1)}%):</span>
                        <span>
                          {formatCurrency(results.downPaymentAmount)}
                        </span>
                      </div>

                      <div className="result-item">
                        <span>Loan Amount:</span>
                        <span>
                          {formatCurrency(results.maxLoanAmount)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="result-row">
                      <div className="result-item">
                        <span>Home Price:</span>
                        <span>
                          {formatCurrency(results.homePrice)}
                        </span>
                      </div>
                      
                      <div className="result-item">
                        <span>Loan Amount:</span>
                        <span>
                          {formatCurrency(results.loanAmount)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Monthly Payment Breakdown */}
              <div className="payment-breakdown">
                <h3>Monthly Payment Breakdown</h3>

                <div className="payment-details">
                  <div className="result-item">
                    <span>Principal & Interest:</span>
                    <span>
                      {formatCurrency(results.baseMonthlyPayment)}
                    </span>
                  </div>

                  {results.monthlyPropertyTax > 0 && (
                    <div className="result-item">
                      <span>Property Tax ({(results.propertyTaxRate * 100).toFixed(3)}%):</span>
                      <span>
                        {formatCurrency(results.monthlyPropertyTax)}
                      </span>
                    </div>
                  )}

                  {results.monthlyInsurance > 0 && (
                    <div className="result-item">
                      <span>Home Insurance:</span>
                      <span>
                        {formatCurrency(results.monthlyInsurance)}
                      </span>
                    </div>
                  )}

                  {results.enableFHA && results.monthlyMIP > 0 && (
                    <div className="result-item">
                      <span>MIP (Mortgage Insurance Premium):</span>
                      <span>
                        {formatCurrency(results.monthlyMIP)}
                      </span>
                    </div>
                  )}

                  <div className="result-item total">
                    <span>Total Monthly Payment:</span>
                    <span>
                      {formatCurrency(results.totalMonthlyPayment)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Results Toggle Section */}
              <div className="financial-details">
                <button 
                  className="toggle-details-btn"
                  onClick={() => setShowDetailedResults(!showDetailedResults)}
                >
                  {showDetailedResults ? 'Hide Detailed Analysis' : 'Show Detailed Analysis'}
                </button>
                
                {showDetailedResults && (
                  <div className="detailed-results">
                    {/* Payment options by term - Only show when detailed results are toggled */}
                    {paymentsByTerm && (
                      <div className="term-comparison">
                        <h3>Payment Options by Term</h3>

                        <div className="term-options">
                          {Object.entries(paymentsByTerm).map(([term, data]) => (
                            <div key={term} className={`term-option ${data.affordabilityClass}`}>
                              <div className="term-header">
                                <span>{term} Year {term === housingData.loanTermYears ? '(selected)' : ''}</span>
                                <span className="term-payment">{formatCurrency(data.totalPayment)}/mo</span>
                              </div>
                              
                              <div className="term-details">
                                <div className="term-detail">
                                  <span>Rate:</span>
                                  <span>{data.interestRate.toFixed(2)}%</span>
                                </div>
                                
                                <div className="term-detail">
                                  <span>% of Gross Income:</span>
                                  <span>
                                    {data.percentOfGrossIncome.toFixed(1)}%
                                  </span>
                                </div>
                                
                                <div className="term-detail">
                                  <span>% of Take-Home Pay:</span>
                                  <span>
                                    {data.percentOfTakeHomeIncome.toFixed(1)}%
                                  </span>
                                </div>
                                
                                <div className="term-detail">
                                  <span>Total Interest:</span>
                                  <span>{formatCurrency(data.totalInterest)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tax breakdown */}
                    <div className="tax-breakdown">
                      <h3>Tax Breakdown</h3>
                      <div className="result-item">
                        <span>Federal Tax:</span>
                        <span>{formatCurrency(results.taxResults.federal)}/year</span>
                      </div>
                      <div className="result-item">
                        <span>FICA:</span>
                        <span>{formatCurrency(results.taxResults.fica)}/year</span>
                      </div>
                      <div className="result-item">
                        <span>State Tax:</span>
                        <span>{formatCurrency(results.taxResults.state)}/year</span>
                      </div>
                      {results.taxResults.local > 0 && (
                        <div className="result-item">
                          <span>Local Tax:</span>
                          <span>{formatCurrency(results.taxResults.local)}/year</span>
                        </div>
                      )}
                      <div className="result-item total">
                        <span>Total Tax:</span>
                        <span>{formatCurrency(results.taxResults.total)}/year</span>
                      </div>
                      <div className="result-item">
                        <span>Effective Tax Rate:</span>
                        <span>{(results.taxResults.effectiveRate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-results">
              <p>Enter your details and click "Calculate" to see results</p>
              
              <div className="calculator-info">
                <h3>How This Calculator Works</h3>
                <p>This calculator uses industry-standard affordability guidelines:</p>
                <ul>
                  <li><strong>28% Rule:</strong> Your monthly mortgage payment should not exceed 28% of your gross monthly income.</li>
                  <li><strong>36% Rule:</strong> Your total monthly debt payments (including mortgage) should not exceed 36% of your gross monthly income.</li>
                </ul>
                <p>The calculator uses these rules to determine either how much home you can afford or whether a specific home price is affordable for you.</p>
                
                <h4>Property Tax Integration</h4>
                <p>Property taxes are calculated using:</p>
                <ul>
                  <li><strong>State/County Data:</strong> Actual property tax rates by county when selected</li>
                  <li><strong>Default Rate:</strong> 2.8% annual rate when no location is specified</li>
                  <li><strong>What Can I Afford:</strong> Property tax on maximum affordable home price</li>
                  <li><strong>Analyze Mortgage:</strong> Property tax on entered home price</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeAffordabilityCalculator;
