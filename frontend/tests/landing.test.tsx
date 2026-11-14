import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from '../src/pages/LandingPage';
import { describe, test, expect } from 'vitest';

describe('Landing Page Frontend Tests', () => {
  test('renders Keepr brand tagline and primary CTA', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getAllByText(/Keepr/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Everything important/i)).toBeInTheDocument();
    expect(screen.getByText(/kept in one place/i)).toBeInTheDocument();
    expect(screen.getByText(/Get Started Free/i)).toBeInTheDocument();
    expect(screen.getByText(/Explore Live Demo/i)).toBeInTheDocument();
  });

  test('renders all 6 core product module features', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getAllByText(/Bills & Recurring Payments/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Subscription Manager/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Secure Document Vault/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Household Inventory/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tasks & Chores/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Real PostgreSQL Analytics/i).length).toBeGreaterThan(0);
  });
});
