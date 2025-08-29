import { createBrowserRouter } from 'react-router-dom';
import AboutPage from './pages/about';
import ContactPage from './pages/contact';
import FAQPage from './pages/faq';
import ServicesPage from './pages/services';
import MerchantDashboard from './pages/merchant/dashboard';
import CustomerDashboard from './pages/customer/dashboard';

export const router = createBrowserRouter([
  {
    path: '/about',
    element: <AboutPage />,
  },
  {
    path: '/contact',
    element: <ContactPage />,
  },
  {
    path: '/faq',
    element: <FAQPage />,
  },
  {
    path: '/services',
    element: <ServicesPage />,
  },
  {
    path: '/merchant/dashboard',
    element: <MerchantDashboard />,
  },
  {
    path: '/customer/dashboard',
    element: <CustomerDashboard />,
  },
]);
