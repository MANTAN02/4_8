import { useState } from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, MessageSquare, Clock, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Contact() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message Sent!",
        description: "We'll get back to you within 24 hours. Thank you for contacting Baartal!",
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        category: "",
        message: ""
      });
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-baartal-cream">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-3xl lg:text-4xl font-bold text-baartal-blue mb-6">
            Get in Touch
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have questions about Baartal? Want to join as a business or customer? 
            We'd love to hear from you!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-baartal-blue flex items-center">
                <MessageSquare className="mr-2" />
                Send us a Message
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Inquiry Type</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select inquiry type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="business">Business Partnership</SelectItem>
                        <SelectItem value="customer">Customer Support</SelectItem>
                        <SelectItem value="technical">Technical Issue</SelectItem>
                        <SelectItem value="feedback">Feedback</SelectItem>
                        <SelectItem value="media">Media Inquiry</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="Brief subject line"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Tell us how we can help you..."
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-baartal-orange hover:bg-orange-600 text-white py-3"
                  disabled={isSubmitting}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-baartal-blue mb-6">Contact Information</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <Mail className="h-6 w-6 text-baartal-orange mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-baartal-blue">Email</h4>
                      <p className="text-gray-700">hello@baartal.com</p>
                      <p className="text-gray-700">support@baartal.com</p>
                      <p className="text-sm text-gray-600 mt-1">We respond within 24 hours</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <Phone className="h-6 w-6 text-baartal-orange mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-baartal-blue">Phone</h4>
                      <p className="text-gray-700">+91 9876543210</p>
                      <p className="text-sm text-gray-600 mt-1">Mon-Sat, 9 AM - 7 PM</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <MapPin className="h-6 w-6 text-baartal-orange mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-baartal-blue">Office</h4>
                      <p className="text-gray-700">Mumbai, Maharashtra</p>
                      <p className="text-sm text-gray-600 mt-1">Proudly built in Mumbai 🇮🇳</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <Clock className="h-6 w-6 text-baartal-orange mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-baartal-blue">Business Hours</h4>
                      <p className="text-gray-700">Monday - Saturday: 9 AM - 7 PM</p>
                      <p className="text-gray-700">Sunday: 10 AM - 5 PM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4">WhatsApp Support</h3>
                <p className="mb-6 opacity-90">
                  For quick support and instant responses, reach out to us on WhatsApp. 
                  Perfect for urgent business inquiries or customer support.
                </p>
                <Button className="bg-white text-green-600 hover:bg-gray-100 font-semibold">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat on WhatsApp
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-pink-500 to-pink-600 text-white">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold mb-4">Follow Us</h3>
                <p className="mb-6 opacity-90">
                  Stay updated with the latest Baartal news, featured businesses, 
                  and community stories on our social media channels.
                </p>
                <div className="flex space-x-3">
                  <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
                    📸 Instagram
                  </Button>
                  <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white">
                    📘 Facebook
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ CTA */}
        <Card className="mt-12 text-center">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-baartal-blue mb-4">
              Looking for Quick Answers?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Check out our comprehensive FAQ section where we answer the most common 
              questions about B-Coins, bundles, and how Baartal works.
            </p>
            <Button 
              onClick={() => window.location.href = '/faq'}
              variant="outline" 
              className="border-baartal-orange text-baartal-orange hover:bg-baartal-orange hover:text-white"
            >
              Visit FAQ Section
            </Button>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
