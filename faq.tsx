import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { HelpCircle, Coins } from "lucide-react";

export default function FAQ() {
  const faqs = [
    {
      category: "For Customers",
      questions: [
        {
          question: "What are B-Coins and how do they work?",
          answer: "B-Coins are Baartal's digital loyalty currency. When you shop at any Baartal business, you earn B-Coins as a percentage of your bill amount (typically 5-10%). These B-Coins can then be spent at any other business in the same bundle, giving you more flexibility and value than traditional loyalty points."
        },
        {
          question: "How do I earn B-Coins?",
          answer: "You earn B-Coins by shopping at any Baartal-registered business. Simply scan the QR code displayed at the store and enter your bill amount. The percentage of B-Coins you earn depends on each business's settings, but it's typically between 5-10% of your purchase amount."
        },
        {
          question: "Where can I spend my B-Coins?",
          answer: "You can spend B-Coins at any other business in the same bundle as where you earned them. For example, if you earned B-Coins at a kirana store in Andheri West, you can spend them at the salon, café, or any other business in the Andheri West bundle."
        },
        {
          question: "Do B-Coins expire?",
          answer: "No! One of the best features of B-Coins is that they never expire. You can save them up for bigger purchases or use them whenever it's convenient for you."
        },
        {
          question: "Is there a minimum amount to redeem B-Coins?",
          answer: "Most businesses allow you to use any amount of B-Coins, but some may have minimum redemption amounts. Check with individual businesses for their specific policies."
        },
        {
          question: "How do I find businesses in my area?",
          answer: "Use the 'Explore Bundles' feature on our website or app. Enter your pincode or area name to see all the Baartal businesses near you, organized by bundle."
        }
      ]
    },
    {
      category: "For Businesses",
      questions: [
        {
          question: "What is the bundle system?",
          answer: "The bundle system ensures that only one business per category operates in each local area. This means no direct competition within the bundle - for example, only one kirana store, one salon, one café, etc. per neighborhood. This creates a collaborative environment where businesses can refer customers to each other."
        },
        {
          question: "How much does it cost to join Baartal?",
          answer: "There's zero upfront cost to join Baartal. We operate on a pay-per-use model - you only pay when customers actually redeem B-Coins at your business. The more generous you are with B-Coins, the less you pay overall."
        },
        {
          question: "How do I set my B-Coin percentage?",
          answer: "You can set your B-Coin percentage (typically 5-10%) in your merchant dashboard. A higher percentage attracts more customers, but you'll need to balance this with your profit margins. Most successful businesses start with 5-7%."
        },
        {
          question: "What if my category is already taken in my area?",
          answer: "If your business category is already filled in your desired area, you can either choose a nearby area where the category is available, or join a waitlist for your preferred location. We sometimes create sub-categories for very popular business types."
        },
        {
          question: "How do customers redeem B-Coins at my store?",
          answer: "Customers can show you their B-Coin balance on their phone, and you can process the redemption through your merchant dashboard or by scanning their customer QR code. The process is simple and takes less than 30 seconds."
        },
        {
          question: "Can I do business-to-business exchanges?",
          answer: "Yes! One of the unique features of Baartal is B2B barter. You can exchange services with other businesses in your bundle - for example, a salon might provide services to a photographer in exchange for promotional photos."
        },
        {
          question: "How do I generate QR codes for my business?",
          answer: "In your merchant dashboard, go to the 'QR Codes' section where you can generate and download QR codes for customers to scan. You can create different codes for different purposes (earning B-Coins, promotions, etc.)."
        }
      ]
    },
    {
      category: "General",
      questions: [
        {
          question: "Which areas of Mumbai does Baartal cover?",
          answer: "We're rapidly expanding across Mumbai! We currently cover 50+ areas including Andheri, Bandra, Malad, Kandivali, Borivali, Powai, Ghatkopar, Kurla, and many more. Check our 'Explore Bundles' section to see if your area is covered."
        },
        {
          question: "Is Baartal available in other cities?",
          answer: "Currently, Baartal is focused exclusively on Mumbai to ensure we provide the best possible service. Once we've perfected our model here, we plan to expand to other major Indian cities."
        },
        {
          question: "How do I contact customer support?",
          answer: "You can reach us through our WhatsApp support, email, or the contact form on our website. We typically respond within a few hours during business hours."
        },
        {
          question: "Is my personal and financial information secure?",
          answer: "Absolutely. We use industry-standard encryption and security measures to protect all user data. We never store your payment information, and your B-Coin transactions are securely recorded and encrypted."
        },
        {
          question: "Can I suggest a business to join Baartal?",
          answer: "Yes! We love referrals. If you know a business that would be perfect for Baartal, you can refer them through our website or app. Some of our best partnerships have come from customer referrals."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-baartal-cream">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center text-4xl font-bold text-baartal-orange mb-4">
            <HelpCircle className="mr-2" />
            FAQ
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-baartal-blue mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about Baartal, B-Coins, and how our bundle system works.
          </p>
        </div>

        {/* FAQ Sections */}
        {faqs.map((section, sectionIndex) => (
          <Card key={sectionIndex} className="mb-8">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-baartal-blue mb-6 flex items-center">
                <Coins className="mr-2" />
                {section.category}
              </h2>
              <Accordion type="single" collapsible className="space-y-2">
                {section.questions.map((faq, faqIndex) => (
                  <AccordionItem 
                    key={faqIndex} 
                    value={`${sectionIndex}-${faqIndex}`}
                    className="border border-gray-200 rounded-lg px-4"
                  >
                    <AccordionTrigger className="text-left font-semibold text-baartal-blue hover:text-baartal-orange">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 pt-2">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))}

        {/* Still have questions CTA */}
        <Card className="text-center bg-gradient-to-r from-baartal-blue to-blue-900 text-white">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
            <p className="opacity-90 mb-6 max-w-2xl mx-auto">
              Can't find the answer you're looking for? Our support team is here to help! 
              Reach out to us and we'll get back to you as soon as possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/contact" 
                className="bg-baartal-orange text-white px-8 py-3 rounded-full font-semibold hover:bg-orange-600 transition-colors inline-block"
              >
                Contact Support
              </a>
              <a 
                href="#" 
                className="bg-green-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors inline-block"
              >
                WhatsApp Us
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
