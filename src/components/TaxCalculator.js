import React from 'react';
import './TaxCalculator.css';
import HomeAffordabilityCalculator from './HomeAffordabilityCalculator';

function TaxCalculator() {
  return (
    <div className="calculator-container">
      <h1 className="calculator-title">Home Buyer's Financial Calculator</h1>
      <p className="calculator-intro">
        Use this calculator to understand how much home you can afford based on your income and financial situation.
        The calculator considers both your take-home pay and recommended mortgage affordability guidelines.
      </p>
      <HomeAffordabilityCalculator />
    </div>
  );
}

export default TaxCalculator;