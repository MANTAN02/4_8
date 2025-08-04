import { Megaphone, RotateCcw, Shield, Share2, Heart, MapPin } from "lucide-react";

export default function MerchantBenefits() {
  const benefits = [
    {
      icon: Megaphone,
      title: "Free Cross-Promotion",
      description: "Get promoted by all bundle partners through their customer base",
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      icon: RotateCcw,
      title: "Repeat Customers",
      description: "B-Coin loyalty keeps customers coming back for more",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      icon: Shield,
      title: "Zero Risk Model",
      description: "Pay only when customers actually use B-Coins at your shop",
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      icon: Share2,
      title: "Social Media Boost",
      description: "Featured on our Instagram and WhatsApp channels regularly",
      color: "text-pink-600",
      bgColor: "bg-pink-100"
    },
    {
      icon: Heart,
      title: "Community Support",
      description: "Be part of a supportive local business community",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      icon: MapPin,
      title: "Exclusive Territory",
      description: "Only one business per category in your local area",
      color: "text-indigo-600",
      bgColor: "bg-indigo-100"
    }
  ];

  return (
    <section id="merchants" className="py-20 bg-baartal-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-baartal-blue mb-4">Why Merchants Love Baartal</h2>
          <p className="text-xl text-gray-600">Join thousands of successful local businesses</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow">
                <div className={`w-16 h-16 ${benefit.bgColor} rounded-full flex items-center justify-center mb-6`}>
                  <Icon className={`${benefit.color} text-2xl`} />
                </div>
                <h3 className="text-xl font-semibold text-baartal-blue mb-4">{benefit.title}</h3>
                <p className="text-gray-600">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
