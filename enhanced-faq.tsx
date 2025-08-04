import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Coins, Users, Store, MessageSquare, Phone, Mail } from "lucide-react";
import { Link } from "wouter";

export default function FAQ() {
  return (
    <div className="min-h-screen bg-baartal-cream">
      <Navigation />
      
      {/* Header */}
      <section className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <HelpCircle className="h-16 w-16 text-baartal-orange mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-baartal-blue mb-4">Frequently Asked Questions</h1>
            <p className="text-xl text-gray-700">
              Everything you need to know about Baartal's hyperlocal barter and loyalty platform
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-4 mb-12">
            <Button variant="outline" className="h-auto p-4 border-2 border-baartal-orange text-baartal-orange hover:bg-baartal-orange hover:text-white">
              <Coins className="mr-2 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">For Customers</div>
                <div className="text-sm opacity-80">B-Coins, QR scanning, rewards</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 border-2 border-baartal-blue text-baartal-blue hover:bg-baartal-blue hover:text-white">
              <Store className="mr-2 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">For Businesses</div>
                <div className="text-sm opacity-80">Bundles, partnerships, analytics</div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white">
              <Users className="mr-2 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">General</div>
                <div className="text-sm opacity-80">Platform, security, support</div>
              </div>
            </Button>
          </div>

          {/* Customer FAQs */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <Coins className="h-6 w-6 text-baartal-orange mr-3" />
                <h2 className="text-2xl font-bold text-baartal-blue">For Customers</h2>
                <Badge className="ml-3 bg-baartal-orange text-white">Most Popular</Badge>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="customer-1">
                  <AccordionTrigger className="text-left">What are B-Coins and how do they work?</AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    B-Coins are Baartal's digital loyalty currency that you earn when shopping at participating businesses. 
                    Typically, you earn 3-8% of your purchase amount as B-Coins (set by each business). These B-Coins can 
                    then be spent at any participating business within the same bundle, giving you real value and flexibility 
                    in your local shopping experience.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="customer-2">
                  <AccordionTrigger className="text-left">How do I earn B-Coins when shopping?</AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    It's simple! When you make a purchase at any participating business:
                    <br />1. Look for the Baartal QR code at the checkout
                    <br />2. Open the Baartal app and scan the QR code
                    <br />3. Enter your bill amount
                    <br />4. B-Coins are instantly added to your account
                    <br />The business owner will confirm the transaction, and you'll see your B-Coins balance update immediately.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="customer-3">
                  <AccordionTrigger className="text-left">Where can I spend my B-Coins?</AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    You can spend B-Coins at any participating business within the same "bundle" as where you earned them. 
                    Bundles are curated groups of local businesses in your area, with only one business per category 
                    (like one grocery store, one salon, one electronics shop, etc.). This means your B-Coins work across 
                    multiple types of businesses in your neighborhood.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="customer-4">
                  <AccordionTrigger className="text-left">Is there an expiry date for B-Coins?</AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    Currently, B-Coins do not expire. However, we recommend using them regularly to support local businesses 
                    and make the most of your loyalty rewards. We may introduce reasonable expiry periods in the future 
                    (like 12-24 months) with advance notice to all users.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="customer-5">
                  <AccordionTrigger className="text-left">Can I convert B-Coins back to cash?</AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    B-Coins are designed as a loyalty reward system and cannot be converted directly to cash. However, 
                    they have real value when spending at participating businesses - essentially giving you discounts 
                    on your future purchases. This system is designed to support the local business ecosystem.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Business FAQs */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <Store className="h-6 w-6 text-baartal-blue mr-3" />
                <h2 className="text-2xl font-bold text-baartal-blue">For Businesses</h2>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="business-1">
                  <AccordionTrigger className="text-left">What is a Baartal bundle and how does it work?</AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    A Baartal bundle is an exclusive group of local businesses in a specific area (usually by pincode) 
                    with only one business per category. For example, one grocery store, one salon, one electronics shop, 
                    etc. This ensures no direct competition within the bundle while allowing businesses to share customers 
                    through the B-Coins loyalty system. Customers earn B-Coins at one business and can spend them at any 
                    business in the same bundle.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="business-2">
                  <AccordionTrigger className="text-left">How much does it cost to join Baartal?</AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    Baartal offers different pricing tiers based on your business size and needs. We have plans starting 
                    from ₹999/month for small businesses, with features like QR code generation, customer analytics, 
                    and bundle participation. Contact our team for a customized quote based on your specific requirements 
                    and business category.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="business-3">
                  <AccordionTrigger className="text-left">How do I set my B-Coin percentage?</AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    You can set your B-Coin percentage (typically between 3-8%) in your business dashboard. This is the 
                    percentage of each customer's bill that gets converted to B-Coins for them. Higher percentages can 
                    attract more customers, but you should set a rate that's sustainable for your business. You can 
                    adjust this percentage anytime based on your business strategy.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="business-4">
                  <AccordionTrigger className="text-left">What happens when customers spend B-Coins at my business?</AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    When customers spend B-Coins at your business, you receive the full cash value from Baartal. 
                    The B-Coins are essentially pre-paid by the businesses where customers earned them. You get real 
                    revenue while customers get to use their loyalty rewards. Payments are processed weekly through 
                    our secure payment system.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="business-5">
                  <AccordionTrigger className="text-left">Can I leave a bundle or change bundles?</AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    Yes, you can leave a bundle with 30 days notice. However, changing bundles is subject to availability 
                    in your desired area and category. We maintain the "one business per category per area" rule to 
                    ensure fair competition. Contact our support team to discuss your options if you need to make changes.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* General FAQs */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center mb-6">
                <Users className="h-6 w-6 text-green-600 mr-3" />
                <h2 className="text-2xl font-bold text-baartal-blue">General Questions</h2>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="general-1">
                  <AccordionTrigger className="text-left">Is Baartal available outside Mumbai?</AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    Currently, Baartal is exclusively focused on Mumbai to provide the best hyperlocal experience. 
                    We're building deep relationships with Mumbai businesses and understanding local market dynamics. 
                    Expansion to other cities is planned for the future, but we want to perfect our Mumbai operations first.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="general-2">
                  <AccordionTrigger className="text-left">How secure is my data and B-Coins balance?</AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    Security is our top priority. We use bank-level encryption for all data transmission and storage. 
                    Your B-Coins balance is protected with multiple security layers, and all transactions are logged 
                    and auditable. We comply with Indian data protection regulations and regularly audit our security systems.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="general-3">
                  <AccordionTrigger className="text-left">How do I report a problem or get support?</AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    You can reach our support team through multiple channels:
                    <br />• In-app chat support (fastest response)
                    <br />• Email: support@baartal.com
                    <br />• Phone: +91-XXXXX-XXXXX (10 AM - 8 PM)
                    <br />• WhatsApp: Available through the app
                    <br />We typically respond within 2 hours during business hours.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="general-4">
                  <AccordionTrigger className="text-left">What makes Baartal different from other loyalty programs?</AccordionTrigger>
                  <AccordionContent className="text-gray-700">
                    Baartal is unique because:
                    <br />• Cross-business spending: Earn at one business, spend at another
                    <br />• Exclusive territories: No direct competition within bundles
                    <br />• Community focus: Specifically designed for Mumbai's local economy
                    <br />• Real value: B-Coins have actual purchasing power, not just points
                    <br />• Hyperlocal: Deep integration with neighborhood businesses
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Contact Section */}
          <Card className="bg-gradient-to-r from-baartal-orange to-orange-600 text-white">
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-white mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Still Have Questions?</h2>
              <p className="text-orange-100 mb-6">
                Our support team is here to help you get the most out of Baartal
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/contact">
                  <Button variant="outline" className="bg-white text-baartal-orange hover:bg-gray-100">
                    <Mail className="mr-2 h-4 w-4" />
                    Contact Us
                  </Button>
                </Link>
                <Button variant="outline" className="bg-white text-baartal-orange hover:bg-gray-100">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}