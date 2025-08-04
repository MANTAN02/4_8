export default function Testimonials() {
  const testimonials = [
    {
      name: "Rajesh Kumar",
      business: "Kumar Vada Pav, Andheri West",
      image: "https://images.unsplash.com/photo-1599700403969-f77b3aa74837?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80",
      quote: "I joined Baartal and got 20 new customers in a month — all from my own area! The B-Coin system brings them back again and again."
    },
    {
      name: "Priya Sharma",
      business: "Sharma Electronics, Bandra",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80",
      quote: "The bundle partnership is amazing! My customers discover other shops, and their customers find me. It's a win-win community."
    },
    {
      name: "Mohammad Ali",
      business: "Ali Tailoring, Powai",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150&q=80",
      quote: "Zero upfront cost and I only pay when customers actually use B-Coins. It's the smartest loyalty program I've ever joined."
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-baartal-blue mb-4">What Mumbai Merchants Say</h2>
          <p className="text-xl text-gray-600">Real stories from real business owners</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-baartal-cream rounded-xl p-8 shadow-lg">
              <img 
                src={testimonial.image} 
                alt={`${testimonial.name} - ${testimonial.business}`} 
                className="w-16 h-16 rounded-full object-cover mb-6" 
              />
              <p className="text-gray-700 mb-6 italic">"{testimonial.quote}"</p>
              <div>
                <div className="font-semibold text-baartal-blue">{testimonial.name}</div>
                <div className="text-sm text-gray-600">{testimonial.business}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
