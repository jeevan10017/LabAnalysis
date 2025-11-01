import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import { FaChartBar, FaKeyboard, FaSearch } from 'react-icons/fa';
import { useAuthStore } from '../hooks/useAuthStore';

export default function HomePage() {
  const { user } = useAuthStore();

  return (
    <div className="flex flex-col items-center text-center">
      {/* Hero Section */}
      <section className="w-full py-20">
        <h1 className="text-5xl font-extrabold text-gray-900 md:text-6xl">
          Transform Lab Data into
          <br />
          <span className="text-primary">Actionable Insights</span>
        </h1>
        {/* FIX: Added mx-auto to center the text block */}
        <p className="mt-6 max-w-2xl text-lg text-secondary-dark mx-auto">
          Upload or manually enter your experiment data. Run complex analyses and
          visualize the results instantly. No more manual calculations.
        </p>
        <div className="mt-10 flex justify-center space-x-4">
          <Link to={user ? "/upload" : "/login"}>
            <Button className="px-8 py-3 text-lg">
              Get Started
            </Button>
          </Link>
          <Link to="/extract">
            <Button variant="secondary" className="px-8 py-3 text-lg bg-gray-200">
              Explore Data
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-24 bg-white  shadow-sm">
        <h2 className="text-3xl font-bold text-gray-800">A Smarter Lab Workflow</h2>
        <div className="mt-12 grid max-w-5xl mx-auto grid-cols-1 gap-12 md:grid-cols-3">
          <div className="flex flex-col items-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary-dark">
              <FaKeyboard className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-xl font-semibold">Flexible Input</h3>
            <p className="mt-2 text-secondary-dark">
              Easily upload Excel files or enter your data manually into a dynamic table.
            </p>
          </div>
          <div className="flex flex-col items-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary-dark">
              <FaChartBar className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-xl font-semibold">Analyze & Visualize</h3>
            <p className="mt-2 text-secondary-dark">
              Run in-built calculations or define your own. Visualize results with dynamic, printable graphs.
            </p>
          </div>
          <div className="flex flex-col items-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-light text-primary-dark">
              <FaSearch className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-xl font-semibold">Extract & Share</h3>
            <p className="mt-2 text-secondary-dark">
              Access a public repository of data or keep your own history secure. Download processed data anytime.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}