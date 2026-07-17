import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { PredictionProvider } from '@/contexts/PredictionContext';

import Home from '@/pages/home';
import UploadPage from '@/pages/upload';
import QuestionnairePage from '@/pages/questionnaire';
import Dashboard from '@/pages/dashboard/index';
import FraudDetail from '@/pages/dashboard/fraud';
import BudgetDetail from '@/pages/dashboard/budget';
import History from '@/pages/history';

function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">404 Not Found</h1>
        <p className="mt-2 text-sm text-gray-600">The page you're looking for doesn't exist.</p>
      </div>
    </div>
  );
}

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/upload" component={UploadPage} />
      <Route path="/questionnaire" component={QuestionnairePage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/fraud" component={FraudDetail} />
      <Route path="/dashboard/budget" component={BudgetDetail} />
      <Route path="/history" component={History} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PredictionProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
      </PredictionProvider>
    </QueryClientProvider>
  );
}

export default App;
