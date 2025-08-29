import React from 'react';
import { EnhancedButton } from '../../components/ui/enhanced-button';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-radiant-blue to-radiant-orange bg-clip-text text-transparent">
              About PreBucks
            </h1>
            <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
              Revolutionizing the way you shop and save with our innovative digital wallet system
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
              <p className="mt-4 text-lg text-gray-600">
                We aim to create a seamless shopping experience by connecting merchants and customers
                through our innovative PreBucks wallet system. Our platform enables instant rewards,
                easy payments, and exclusive benefits for both businesses and shoppers.
              </p>
              <EnhancedButton
                variant="gradient"
                size="lg"
                className="mt-8"
                onClick={() => window.location.href = '/get-started'}
              >
                Get Started Today
              </EnhancedButton>
            </div>
            <div className="relative h-[400px] bg-gray-200 rounded-2xl">
              {/* Replace with actual image */}
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                Mission Image Placeholder
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What Makes Us Different
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-12 h-12 bg-radiant-blue/10 rounded-lg flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Meet Our Team
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <div key={index} className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4 bg-gray-200 rounded-full">
                  {/* Replace with actual image */}
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    {member.name.charAt(0)}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {member.name}
                </h3>
                <p className="text-sm text-gray-600">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const features = [
  {
    title: 'Digital Wallet',
    description: 'Secure and easy-to-use digital wallet for all your transactions.',
    icon: '💳',
  },
  {
    title: 'Instant Rewards',
    description: 'Earn rewards instantly with every purchase at participating stores.',
    icon: '🎁',
  },
  {
    title: 'Smart Analytics',
    description: 'Track your spending and rewards with detailed analytics.',
    icon: '📊',
  },
];

const team = [
  {
    name: 'John Doe',
    role: 'CEO & Founder',
  },
  {
    name: 'Jane Smith',
    role: 'CTO',
  },
  {
    name: 'Mike Johnson',
    role: 'Head of Design',
  },
  {
    name: 'Sarah Wilson',
    role: 'Head of Operations',
  },
];

export default AboutPage;
