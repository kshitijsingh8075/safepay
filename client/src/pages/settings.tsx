import React from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

/**
 * Settings page component with appearance settings and theme toggle
 */
export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto max-w-4xl p-4">
        <header className="mb-6">
          <div className="flex items-center mb-4">
            <Link href="/home">
              <a className="flex items-center text-primary hover:text-primary/80">
                <ArrowLeft className="h-5 w-5 mr-2" />
                <span>Back</span>
              </a>
            </Link>
          </div>
          <h1 className="text-2xl font-bold">Settings</h1>
        </header>

        <main className="space-y-8">
          {/* Appearance Section */}
          <section className="bg-card p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Appearance</h2>
            <div className="space-y-6">
              <div className="border-b pb-4">
                <ThemeToggle />
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Preview</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-background border rounded-md p-4 shadow-sm">
                    <h4 className="font-medium mb-2">Light</h4>
                    <p className="text-sm text-muted-foreground">
                      Preview how the app looks in light mode
                    </p>
                  </div>
                  <div className="bg-gray-900 border border-gray-800 rounded-md p-4 shadow-sm text-white">
                    <h4 className="font-medium mb-2">Dark</h4>
                    <p className="text-sm text-gray-400">
                      Preview how the app looks in dark mode
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Other Settings Sections */}
          <section className="bg-card p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Account</h2>
            <p className="text-muted-foreground">Manage your account settings and preferences</p>
          </section>

          <section className="bg-card p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Notifications</h2>
            <p className="text-muted-foreground">Configure how you receive notifications</p>
          </section>
        </main>
      </div>
    </div>
  );
}