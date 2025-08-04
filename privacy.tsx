import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Lock, Eye, UserCheck, Database, Settings } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-baartal-cream">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center text-4xl font-bold text-baartal-orange mb-4">
            <Shield className="mr-2" />
            Privacy Policy
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-baartal-blue mb-6">
            Your Privacy Matters to Us
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We're committed to protecting your personal information and being transparent 
            about how we collect, use, and share your data.
          </p>
          <p className="text-sm text-gray-500 mt-4">Last updated: January 2024</p>
        </div>

        {/* Overview */}
        <Card className="mb-8 bg-gradient-to-r from-baartal-blue to-blue-900 text-white">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold mb-4">Privacy at a Glance</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Lock className="mr-2 h-4 w-4" />
                  What We Collect
                </h3>
                <p className="text-sm opacity-90">
                  Only the information necessary to provide our services: contact details, 
                  business information, and transaction data.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2 flex items-center">
                  <Eye className="mr-2 h-4 w-4" />
                  How We Use It
                </h3>
                <p className="text-sm opacity-90">
                  To operate Baartal, process B-Coin transactions, and improve your experience. 
                  We never sell your personal data.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="space-y-8">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-baartal-blue mb-6 flex items-center">
                <Database className="mr-2" />
                Information We Collect
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-baartal-blue mb-3">Personal Information</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>Contact Details:</strong> Name, email address, phone number</li>
                    <li>• <strong>Location:</strong> Pincode and general area for bundle matching</li>
                    <li>• <strong>Account Information:</strong> Username, encrypted password</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-baartal-blue mb-3">Business Information (For Merchants)</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Business name, category, and address</li>
                    <li>• Owner information and business registration details</li>
                    <li>• Business photos and descriptions</li>
                    <li>• B-Coin settings and promotional information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-baartal-blue mb-3">Transaction Information</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• B-Coin earning and spending history</li>
                    <li>• Purchase amounts and business visits</li>
                    <li>• QR code scan data and timestamps</li>
                    <li>• Ratings and reviews you provide</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-baartal-blue mb-3">Technical Information</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Device type, operating system, and browser information</li>
                    <li>• IP address and general location data</li>
                    <li>• App usage patterns and feature interactions</li>
                    <li>• Error logs and performance data</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-baartal-blue mb-6 flex items-center">
                <Settings className="mr-2" />
                How We Use Your Information
              </h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-baartal-orange rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-baartal-blue">Service Operation</h4>
                    <p className="text-gray-700">To provide Baartal services, process B-Coin transactions, match you with local bundles, and maintain your account.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-baartal-orange rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-baartal-blue">Communication</h4>
                    <p className="text-gray-700">To send you transaction confirmations, account updates, promotional offers, and important service notifications.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-baartal-orange rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-baartal-blue">Improvement</h4>
                    <p className="text-gray-700">To analyze usage patterns, improve our services, develop new features, and enhance the user experience.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-baartal-orange rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-baartal-blue">Safety & Security</h4>
                    <p className="text-gray-700">To protect against fraud, ensure account security, verify business authenticity, and maintain platform integrity.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-baartal-orange rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-baartal-blue">Legal Compliance</h4>
                    <p className="text-gray-700">To comply with applicable laws, respond to legal requests, and protect our rights and the rights of our users.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-baartal-blue mb-6 flex items-center">
                <UserCheck className="mr-2" />
                Information Sharing
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-green-600 mb-3">What We DON'T Do</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• We never sell your personal information to third parties</li>
                    <li>• We don't share your contact details with other users without permission</li>
                    <li>• We don't use your data for advertising by external companies</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-baartal-blue mb-3">When We Share Information</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• <strong>With Bundle Partners:</strong> Basic business information to facilitate the bundle system</li>
                    <li>• <strong>Service Providers:</strong> Trusted third-party services that help us operate (payment processors, hosting, analytics)</li>
                    <li>• <strong>Legal Requirements:</strong> When required by law or to protect our legal rights</li>
                    <li>• <strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of business assets</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-baartal-blue mb-6 flex items-center">
                <Lock className="mr-2" />
                Data Security & Retention
              </h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-baartal-blue mb-3">Security Measures</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Industry-standard encryption for all data transmission and storage</li>
                    <li>• Secure servers with regular security updates and monitoring</li>
                    <li>• Limited access to personal data on a need-to-know basis</li>
                    <li>• Regular security audits and vulnerability assessments</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-baartal-blue mb-3">Data Retention</h3>
                  <p className="text-gray-700 mb-3">
                    We retain your information for as long as necessary to provide our services and comply with legal obligations:
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Account information: Until you delete your account</li>
                    <li>• Transaction history: 7 years for financial record keeping</li>
                    <li>• Marketing data: Until you unsubscribe or opt out</li>
                    <li>• Technical logs: 2 years for security and troubleshooting</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-baartal-blue mb-6">Your Rights & Choices</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-baartal-blue mb-3">Account Control</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• View and update your profile information</li>
                    <li>• Control your communication preferences</li>
                    <li>• Download your transaction history</li>
                    <li>• Delete your account and associated data</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-baartal-blue mb-3">Privacy Rights</h3>
                  <ul className="space-y-2 text-gray-700 text-sm">
                    <li>• Request access to your personal data</li>
                    <li>• Correct inaccurate information</li>
                    <li>• Object to certain data processing</li>
                    <li>• Request data portability</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-baartal-blue mb-6">Contact & Updates</h2>
              <div className="space-y-4">
                <p className="text-gray-700">
                  If you have any questions about this Privacy Policy or how we handle your data, 
                  please contact us at <strong>privacy@baartal.com</strong> or through our contact page.
                </p>
                <p className="text-gray-700">
                  We may update this Privacy Policy from time to time. When we make significant changes, 
                  we'll notify you via email or through the app. The updated policy will be posted on 
                  our website with a new "Last updated" date.
                </p>
                <div className="bg-baartal-cream p-4 rounded-lg">
                  <h3 className="font-semibold text-baartal-blue mb-2">Questions About Your Data?</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    We're here to help with any privacy-related questions or requests.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a href="/contact" className="bg-baartal-orange text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors text-center">
                      Contact Us
                    </a>
                    <a href="mailto:privacy@baartal.com" className="bg-baartal-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors text-center">
                      Email Privacy Team
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
