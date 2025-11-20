import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, BookOpen, Ticket, Wrench, CheckCircle, Clock, Users, 
  UserPlus, Award, DollarSign, Briefcase, ArrowRight, Zap, Shield, HeartHandshake 
} from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpg';

const Home = () => {
  const { isAuthenticated, user, isClient } = useAuth();

  const features = [
    {
      icon: MessageSquare,
      title: 'AI-Powered Support',
      description: 'Chat with our AI assistant powered by Google Gemini to get instant help with your PC issues.',
      color: 'bg-blue-500',
    },
    {
      icon: BookOpen,
      title: 'Issue Library',
      description: 'Browse thousands of resolved issues with detailed solutions and step-by-step guides.',
      color: 'bg-purple-500',
    },
    {
      icon: Ticket,
      title: 'Support Tickets',
      description: 'Create support tickets and track their progress from submission to resolution.',
      color: 'bg-green-500',
    },
    {
      icon: Users,
      title: 'Expert Technicians',
      description: 'Our certified technicians are ready to help with any hardware or software problems.',
      color: 'bg-orange-500',
    },
  ];

  const stats = [
    { label: 'Issues Resolved', value: '10,000+', icon: CheckCircle, color: 'text-green-600' },
    { label: 'Avg Response Time', value: '< 2 hours', icon: Clock, color: 'text-blue-600' },
    { label: 'Expert Technicians', value: '50+', icon: Users, color: 'text-purple-600' },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center mb-6">
          <img 
            src={logo} 
            alt="TechCare Pro" 
            className="h-24 w-auto rounded-xl shadow-lg"
          />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to <span className="text-primary-600">TechCare Pro</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Your one-stop solution for all PC repair needs. Get instant AI support, browse resolved issues, 
          or create a support ticket for personalized assistance from certified technicians.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {isAuthenticated ? (
            <>
              <Link to="/chat">
                <Button variant="primary" size="lg">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Start AI Chat
                </Button>
              </Link>
              <Link to="/tickets">
                <Button variant="outline" size="lg">
                  <Ticket className="w-5 h-5 mr-2" />
                  My Tickets
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/register">
                <Button variant="primary" size="lg">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/issues">
                <Button variant="outline" size="lg">
                  Browse Issues
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="text-center">
              <Icon className={`w-12 h-12 ${stat.color} mx-auto mb-3`} />
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </Card>
          );
        })}
      </div>

      {/* Features Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          How We Help You
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className={`${feature.color} p-3 rounded-xl flex-shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
          Why Choose TechCare Pro?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Fast Response</h3>
            <p className="text-gray-600">
              Get help within 2 hours. Our AI provides instant answers, and technicians respond quickly.
            </p>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Certified Experts</h3>
            <p className="text-gray-600">
              All our technicians are certified professionals with years of experience.
            </p>
          </Card>
          
          <Card className="text-center hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HeartHandshake className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Satisfaction Guaranteed</h3>
            <p className="text-gray-600">
              We stand behind our work. 100% satisfaction guaranteed or your money back.
            </p>
          </Card>
        </div>
      </div>

      {/* Become a Technician Section */}
      {(isClient || !isAuthenticated) && (
        <div className="mb-16">
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white overflow-hidden relative">
            <div className="absolute right-0 top-0 opacity-10">
              <Wrench className="w-64 h-64 transform rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <UserPlus className="w-8 h-8" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-4 text-center">
                Join Our Team of Expert Technicians
              </h2>
              <p className="text-orange-100 text-lg mb-8 max-w-3xl mx-auto text-center">
                Are you a skilled PC repair technician? Join TechCare Pro and help thousands of customers 
                solve their computer problems while earning a competitive income.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold mb-1">Competitive Pay</h4>
                  <p className="text-orange-100 text-sm">Earn $50-$100 per ticket</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold mb-1">Flexible Hours</h4>
                  <p className="text-orange-100 text-sm">Work on your own schedule</p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold mb-1">Build Your Reputation</h4>
                  <p className="text-orange-100 text-sm">Get reviews and grow your career</p>
                </div>
              </div>
              
              <div className="text-center">
                <Link to={isAuthenticated ? "/technician/apply" : "/register"}>
                  <Button 
                    variant="secondary" 
                    size="lg"
                    className="bg-white text-orange-600 hover:bg-gray-100"
                  >
                    {isAuthenticated ? "Apply Now" : "Sign Up & Apply"}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* CTA Section */}
      {!isAuthenticated && (
        <Card className="bg-gradient-to-r from-primary-600 to-primary-700 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-primary-100 text-lg mb-6 max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust us with their PC repair needs.
          </p>
          <Link to="/register">
            <Button variant="secondary" size="lg">
              Create Free Account
            </Button>
          </Link>
        </Card>
      )}
    </MainLayout>
  );
};

export default Home;
