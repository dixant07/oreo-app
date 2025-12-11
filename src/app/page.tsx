"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Video,
  Gamepad2,
  Users,
  MessageCircle,
  Shield,
  Zap,
  Globe,
  Star,
  Play,
  ChevronRight,
  Sparkles,
  Heart
} from 'lucide-react';

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 text-white overflow-x-hidden">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/50' : 'bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40 transition-all duration-300 group-hover:scale-105">
              <span className="text-xl font-bold text-white">O</span>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              Oreo
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-zinc-400 hover:text-white transition-colors duration-200">Features</a>
            <a href="#how-it-works" className="text-zinc-400 hover:text-white transition-colors duration-200">How It Works</a>
            <a href="#games" className="text-zinc-400 hover:text-white transition-colors duration-200">Games</a>
            <a href="#testimonials" className="text-zinc-400 hover:text-white transition-colors duration-200">Testimonials</a>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-zinc-300 hover:text-white hover:bg-zinc-800/50">
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300">
                Sign Up Free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-6 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-sm text-zinc-300">Connect. Play. Make Friends.</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                Video Chat & Play
              </span>
              <br />
              <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
                With New Friends
              </span>
            </h1>

            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Meet amazing people from around the world. Have fun playing mini-games together
              while video chatting. Break the ice, make connections, create memories.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white text-lg px-8 py-6 shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105">
                  <Play className="w-5 h-5 mr-2" />
                  Start Chatting Now
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800/50 hover:text-white text-lg px-8 py-6 group">
                Watch Demo
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Hero Video/GIF Placeholder */}
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-pink-600 rounded-3xl blur-2xl opacity-30 -z-10"></div>
              <div className="relative bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
                {/* Placeholder for hero video/gif - Replace with actual video */}
                <div className="aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center relative group cursor-pointer">
                  <img
                    src="https://placehold.co/1200x675/1a1a2e/ff6b6b?text=🎮+Video+Demo+Placeholder"
                    alt="Oreo Demo Video"
                    className="w-full h-full object-cover opacity-60"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/30 transition-all duration-300">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-orange-500 to-pink-600 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-20">
            {[
              { number: "1M+", label: "Active Users" },
              { number: "50M+", label: "Connections Made" },
              { number: "10+", label: "Fun Games" },
              { number: "150+", label: "Countries" },
            ].map((stat, index) => (
              <div key={index} className="text-center p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm hover:border-orange-500/30 transition-all duration-300">
                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-zinc-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Why Choose Oreo?
              </span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Experience the perfect blend of video chatting and gaming entertainment
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Video,
                title: "HD Video Chat",
                description: "Crystal clear video quality with low latency. Feel like you're in the same room with your new friends.",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: Gamepad2,
                title: "Fun Mini-Games",
                description: "Play exciting games like Knife Throw, Tic-Tac-Toe, and more while chatting. Break the ice naturally!",
                gradient: "from-orange-500 to-pink-500"
              },
              {
                icon: Users,
                title: "Smart Matching",
                description: "Our AI matches you with people who share your interests and gaming preferences.",
                gradient: "from-purple-500 to-pink-500"
              },
              {
                icon: Shield,
                title: "Safe & Secure",
                description: "Advanced moderation and privacy controls keep your experience safe and enjoyable.",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: MessageCircle,
                title: "Real-Time Chat",
                description: "Text chat alongside video if you prefer. Send emojis, GIFs, and reactions!",
                gradient: "from-yellow-500 to-orange-500"
              },
              {
                icon: Globe,
                title: "Global Community",
                description: "Connect with people from 150+ countries. Automatic translation coming soon!",
                gradient: "from-pink-500 to-rose-500"
              }
            ].map((feature, index) => (
              <Card key={index} className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm hover:border-zinc-700 transition-all duration-300 group hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Get started in just 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Account",
                description: "Sign up in seconds with your email or Google account. Complete your profile to get better matches.",
                image: "https://placehold.co/400x300/1a1a2e/ff6b6b?text=📝+Sign+Up"
              },
              {
                step: "02",
                title: "Find a Match",
                description: "Choose to video chat, play games, or both! Our smart matching finds the perfect person for you.",
                image: "https://placehold.co/400x300/1a1a2e/ff6b6b?text=🎯+Match"
              },
              {
                step: "03",
                title: "Chat & Play",
                description: "Start your video call and choose a fun mini-game to play together. Make friends, have fun!",
                image: "https://placehold.co/400x300/1a1a2e/ff6b6b?text=🎮+Play"
              }
            ].map((step, index) => (
              <div key={index} className="relative group">
                <div className="absolute -top-6 -left-2 text-8xl font-bold text-zinc-800/50 group-hover:text-orange-500/20 transition-colors duration-300">
                  {step.step}
                </div>
                <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all duration-300">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="w-full aspect-[4/3] object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                    <p className="text-zinc-400">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section id="games" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                Fun Games to Play
              </span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Break the ice with our collection of exciting mini-games
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                name: "Knife Throw",
                description: "Test your aim in this exciting target practice game!",
                image: "https://placehold.co/300x400/1a1a2e/ff6b6b?text=🔪+Knife+Throw",
                badge: "Popular"
              },
              {
                name: "Tic-Tac-Toe",
                description: "Classic game with a modern twist!",
                image: "https://placehold.co/300x400/1a1a2e/ff6b6b?text=⭕+Tic+Tac+Toe",
                badge: "Classic"
              },
              {
                name: "Connect Four",
                description: "Strategy meets fun in this colorful challenge!",
                image: "https://placehold.co/300x400/1a1a2e/ff6b6b?text=🔴+Connect+4",
                badge: "New"
              },
              {
                name: "Chess",
                description: "The ultimate game of minds!",
                image: "https://placehold.co/300x400/1a1a2e/ff6b6b?text=♟️+Chess",
                badge: "Coming Soon"
              }
            ].map((game, index) => (
              <div key={index} className="group relative">
                <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all duration-300 hover:-translate-y-2">
                  <div className="absolute top-4 right-4 z-10">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${game.badge === 'Popular' ? 'bg-orange-500 text-white' :
                      game.badge === 'New' ? 'bg-green-500 text-white' :
                        game.badge === 'Classic' ? 'bg-blue-500 text-white' :
                          'bg-zinc-700 text-zinc-300'
                      }`}>
                      {game.badge}
                    </span>
                  </div>
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-semibold text-white mb-1">{game.name}</h3>
                    <p className="text-zinc-400 text-sm">{game.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/games">
              <Button size="lg" variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800/50 hover:text-white group">
                View All Games
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-6 bg-zinc-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                What People Say
              </span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Join thousands of happy users making connections daily
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Sarah M.",
                location: "New York, USA",
                avatar: "https://placehold.co/60x60/ff6b6b/white?text=SM",
                text: "I was skeptical at first, but Oreo made meeting new people so much fun! The games really help break the ice. Met some amazing friends here! 💖",
                rating: 5
              },
              {
                name: "Alex K.",
                location: "London, UK",
                avatar: "https://placehold.co/60x60/4ecdc4/white?text=AK",
                text: "The video quality is incredible and the mini-games are addictive! It's like Omegle but actually good. No weird stuff, just genuine connections.",
                rating: 5
              },
              {
                name: "Priya S.",
                location: "Mumbai, India",
                avatar: "https://placehold.co/60x60/ffe66d/333?text=PS",
                text: "Finally a platform where I can chat AND play games simultaneously! The matching is smart and I've made friends from 10+ different countries.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <Card key={index} className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-sm hover:border-zinc-700 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-zinc-300 mb-6 leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <div className="font-semibold text-white">{testimonial.name}</div>
                      <div className="text-zinc-500 text-sm">{testimonial.location}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-purple-500/20"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-500/30 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800/50 border border-zinc-700/50 mb-6 backdrop-blur-sm">
            <Heart className="w-4 h-4 text-pink-500" />
            <span className="text-sm text-zinc-300">Join 1M+ Happy Users</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Ready to Make
            </span>
            <br />
            <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              New Friends?
            </span>
          </h2>

          <p className="text-zinc-400 text-lg mb-10 max-w-2xl mx-auto">
            Join the most fun way to connect with people worldwide.
            It's free, it's safe, and it's waiting for you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white text-lg px-10 py-6 shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105">
                <Zap className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
            </Link>
          </div>

          <p className="text-zinc-500 text-sm mt-6">
            No credit card required • Takes less than 30 seconds
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-zinc-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-pink-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">O</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
                  Oreo
                </span>
              </Link>
              <p className="text-zinc-500 text-sm">
                The most fun way to meet new people and make friends through video chat and games.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-zinc-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#games" className="hover:text-white transition-colors">Games</a></li>
                <li><Link href="/membership" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Mobile App</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-zinc-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-zinc-400 text-sm">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/refund-policy" className="hover:text-white transition-colors">Refund & Cancellation</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Community Guidelines</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-zinc-800/50">
            <p className="text-zinc-500 text-sm">
              © 2024 Oreo. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              {/* Social Links - placeholder */}
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                <span className="text-zinc-400">𝕏</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                <span className="text-zinc-400">in</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                <span className="text-zinc-400">▶</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 transition-colors">
                <span className="text-zinc-400">📸</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
