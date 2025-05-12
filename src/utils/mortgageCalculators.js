// src/utils/mortgageCalculators.js

import { validateMonthlyDebts, validateDownPaymentPercent, validateInterestRate, validateLoanTerm } from './taxValidators';

// Calculate monthly mortgage payment
export const calculateMonthlyMortgage = (homePrice, downPaymentPercent, interestRate, loanTermYears) => {
  // Calculate loan amount
  const downPayment = homePrice * (downPaymentPercent / 100);
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

// Calculate what percentage of take-home pay the mortgage represents
export const calculateMortgagePercentage = (monthlyMortgage, monthlyTakeHome) => {
  if (monthlyTakeHome === 0) return 0;
  return (monthlyMortgage / monthlyTakeHome) * 100;
};

// Calculate maximum home price based on take-home pay
export const calculateMaxHomePrice = (monthlyTakeHome, interestRate, loanTermYears, downPaymentPercent, monthlyDebts = 0) => {
  // Maximum payment should be 28% of monthly take-home pay minus existing debts
  const maxMonthlyPayment = (monthlyTakeHome * 0.28) - monthlyDebts;
  
  if (maxMonthlyPayment <= 0) return 0;
  
  // Convert annual interest rate to monthly
  const monthlyInterestRate = (interestRate / 100) / 12;
  
  // Number of payments
  const numberOfPayments = loanTermYears * 12;
  
  // Avoid division by zero for 0% interest
  if (monthlyInterestRate === 0) {
    const maxLoanAmount = maxMonthlyPayment * numberOfPayments;
    return maxLoanAmount / (1 - (downPaymentPercent / 100));
  }
  
  // Calculate maximum loan amount
  // Using formula: P = pmt * (1 - (1 + r)^-n) / r
  const maxLoanAmount = maxMonthlyPayment * 
    (1 - Math.pow(1 + monthlyInterestRate, -numberOfPayments)) / 
    monthlyInterestRate;
  
  // Calculate max home price (loan amount + down payment)
  const maxHomePrice = maxLoanAmount / (1 - (downPaymentPercent / 100));
  
  return maxHomePrice;
};

// Validate mortgage inputs
export const validateMortgageInputs = (inputs) => {
  const errors = {};
  
  if (inputs.includeHomePurchase) {
    if (!inputs.homePrice || isNaN(parseFloat(inputs.homePrice)) || parseFloat(inputs.homePrice) <= 0) {
      errors.homePrice = 'Please enter a valid home price';
    }
    
    const downPaymentError = validateDownPaymentPercent(inputs.downPaymentPercent);
    if (downPaymentError) errors.downPaymentPercent = downPaymentError;
    
    const interestRateError = validateInterestRate(inputs.interestRate);
    if (interestRateError) errors.interestRate = interestRateError;
    
    const loanTermError = validateLoanTerm(inputs.loanTermYears);
    if (loanTermError) errors.loanTermYears = loanTermError;
  }
  
  return errors;
};

// Format currency for display
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
};

export default {
  calculateMonthlyMortgage,
  calculateMortgagePercentage,
  calculateMaxHomePrice,
  validateMortgageInputs,
  formatCurrency
};