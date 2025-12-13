import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '@/components/Sidebar';
import { BrowserRouter } from 'react-router-dom';

describe('Sidebar Component', () => {
  it('renders navigation links', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/Library/i)).toBeInTheDocument();
    expect(screen.getByText(/Calendar/i)).toBeInTheDocument();
    expect(screen.getByText(/People/i)).toBeInTheDocument();
    expect(screen.getByText(/Albums/i)).toBeInTheDocument();
    expect(screen.getByText(/Places/i)).toBeInTheDocument();
    expect(screen.getByText(/Duplicates/i)).toBeInTheDocument();
    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
  });

  it('displays application name', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
    
    expect(screen.getByText(/PIXONA/i)).toBeInTheDocument();
  });

  it('has accessible navigation structure', () => {
    const { container } = render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );
    
    // Check for navigation element
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });
});
