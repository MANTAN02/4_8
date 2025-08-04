import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MapPin, Clock, MessageSquare, Send, Users, Store } from "lucide-react";
import { useState } from "react";

export default function Contact() {
  const { toast } = useToast();
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    phone: "",
    userType: "",
    subject: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate form submission
    toast({
      title: "Message Sent!",
      description: "We'll get back to you within 24 hours.",
    });
    
    // Reset form
    setContactForm({
      name: "",
      email: "",
      phone: "",
      userType: "",
      subject: "",
      message: ""
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-baartal-cream">
      <Navigation />
      
      {/* Header */}
      <section className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <MessageSquare className="h-16 w-16 text-baartal-orange mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-baartal-blue mb-4">Contact Us</h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              We're here to help you succeed with Baartal. Reach out to our team for support, 
              partnership opportunities, or any questions about our hyperlocal platform.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Contact Information */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Phone className="h-6 w-6 text-baartal-orange mr-3" />
                    <h3 className="text-lg font-semibold text-baartal-blue">Phone Support</h3>
                  </div>
                  <div className="space-y-2 text-gray-700">
                    <p className="font-medium">Customer Support</p>
                    <p>+91-XXXXX-11111</p>
                    <p className="font-medium">Business Partnerships</p>
                    <p>+91-XXXXX-22222</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Mail className="h-6 w-6 text-baartal-orange mr-3" />
                    <h3 className="text-lg font-semibold text-baartal-blue">Email Us</h3>
                  </div>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>General:</strong> hello@baartal.com</p>
                    <p><strong>Support:</strong> support@baartal.com</p>
                    <p><strong>Business:</strong> partners@baartal.com</p>
                    <p><strong>Press:</strong> media@baartal.com</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <MapPin className="h-6 w-6 text-baartal-orange mr-3" />
                    <h3 className="text-lg font-semibold text-baartal-blue">Office Location</h3>
                  </div>
                  <div className="text-gray-700">
                    <p>Baartal Technologies Pvt. Ltd.</p>
                    <p>123 Business Hub, Andheri East</p>
                    <p>Mumbai, Maharashtra 400069</p>
                    <p>India</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <Clock className="h-6 w-6 text-baartal-orange mr-3" />
                    <h3 className="text-lg font-semibold text-baartal-blue">Business Hours</h3>
                  </div>
                  <div className="space-y-2 text-gray-700">
                    <p><strong>Monday - Friday:</strong> 9:00 AM - 8:00 PM</p>
                    <p><strong>Saturday:</strong> 10:00 AM - 6:00 PM</p>
                    <p><strong>Sunday:</strong> Closed</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Emergency support available 24/7 through the app
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl text-baartal-blue">Send Us a Message</CardTitle>
                  <p className="text-gray-600">
                    Fill out the form below and we'll get back to you as soon as possible.
                  </p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={contactForm.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={contactForm.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          placeholder="+91 XXXXX XXXXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="userType">I am a *</Label>
                        <Select value={contactForm.userType} onValueChange={(value) => handleInputChange('userType', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer</SelectItem>
                            <SelectItem value="business">Business Owner</SelectItem>
                            <SelectItem value="potential-partner">Potential Partner</SelectItem>
                            <SelectItem value="investor">Investor</SelectItem>
                            <SelectItem value="media">Media/Press</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        value={contactForm.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        placeholder="What can we help you with?"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={contactForm.message}
                        onChange={(e) => handleInputChange('message', e.target.value)}
                        placeholder="Tell us more about your inquiry..."
                        rows={5}
                        required
                      />
                    </div>

                    <div className="bg-baartal-cream p-4 rounded-lg">
                      <p className="text-sm text-gray-700">
                        <strong>Response Time:</strong> We typically respond within 24 hours during business days. 
                        For urgent matters, please call our support line or use the in-app chat feature.
                      </p>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-baartal-orange hover:bg-orange-600 text-white"
                      size="lg"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Contact Options */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-baartal-blue mb-4">Need Immediate Help?</h2>
            <p className="text-gray-700">Choose the fastest way to get in touch with our team</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Users className="h-12 w-12 text-baartal-orange mx-auto mb-4" />
                <h3 className="text-lg font-bold text-baartal-blue mb-2">Customer Support</h3>
                <p className="text-gray-600 mb-4">Get help with your account, B-Coins, or app usage</p>
                <Button className="bg-baartal-orange hover:bg-orange-600">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Live Chat
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Store className="h-12 w-12 text-baartal-blue mx-auto mb-4" />
                <h3 className="text-lg font-bold text-baartal-blue mb-2">Business Support</h3>
                <p className="text-gray-600 mb-4">Partnership inquiries, onboarding, and business tools</p>
                <Button className="bg-baartal-blue hover:bg-blue-800">
                  <Phone className="mr-2 h-4 w-4" />
                  Call Now
                </Button>
              </CardContent>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow md:col-span-2 lg:col-span-1">
              <CardContent className="p-6">
                <MessageSquare className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-baartal-blue mb-2">WhatsApp Support</h3>
                <p className="text-gray-600 mb-4">Quick questions and instant assistance</p>
                <Button className="bg-green-600 hover:bg-green-700">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}