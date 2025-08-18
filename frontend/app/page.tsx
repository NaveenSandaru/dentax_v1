"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Menu, X, Phone, Mail, Building, MessageSquare } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import ContactForm from '@/components/contactUsForm'

export default function HomePage() {

  const router = useRouter();

  // Auto-redirect configuration - set this to true to redirect to login
  const SHOULD_REDIRECT_TO_LOGIN = false;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("home")
  const [activePlan, setActivePlan] = useState("basic");

  const [redirecting, setRedirecting] = useState(false);
  const [openContactForm, setOpenContactForm] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  const [subject, setSubject] = useState("");
  const [pricingPlan, setPricingPlan] = useState("");

  // Auto-redirect effect - runs immediately when component mounts
  useEffect(() => {
    if (SHOULD_REDIRECT_TO_LOGIN) {
      setRedirecting(true);
      router.replace("/login"); // Use replace instead of push to avoid adding to history
      return; // Exit early to prevent further execution
    }
  }, [router]);

  function cn(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
  }

  const redirectToLogin = () => {
    setRedirecting(true);
    try {
      router.push("/login");
    }
    catch (err: any) {
      toast.error(err.message);
    }
    finally {
      setRedirecting(false);
    }
  }

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
      setIsMobileMenuOpen(false)
    }
  }

  const handleDemoRequest = () => {
    setSubject("Requesting a demonstration of the Dentax system");
    setOpenContactForm(true);
  };

  const handlePurchaseRequest = (plan: string) => {
    setSubject("Requesting information about purchasing the Dentax system");
    setPricingPlan(plan);
    setOpenContactForm(true);
  };

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "features", "demo", "pricing", "contact"]
      const scrollPosition = window.scrollY + 100

      for (const section of sections) {
        const element = document.getElementById(section)
        if (element) {
          const offsetTop = element.offsetTop
          const offsetHeight = element.offsetHeight

          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, []);

  // Show loading state during redirect
  if (SHOULD_REDIRECT_TO_LOGIN || redirecting) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#06A475] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm fixed w-full top-0 z-50 border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img src="/logo.png" alt="Logo" className="h-6 w-6 md:h-10 md:w-10" />
              <div>
                <span className="text-xl font-bold text-[#06A475]">DE</span>
                <span className="text-xl font-bold text-gray-700">N</span>
                <span className="text-xl font-bold text-[#06A475]">TAX</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              <button
                onClick={() => scrollToSection("home")}
                className={`hover:text-[#06A475] transition-colors ${activeSection === "home"
                  ? "text-[#06A475] font-medium  underline underline-offset-4 "
                  : "text-gray-700"
                  }`}
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection("features")}
                className={`hover:text-[#06A475] transition-colors ${activeSection === "features"
                  ? "text-[#06A475] font-medium underline underline-offset-4 "
                  : "text-gray-700"
                  }`}
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection("demo")}
                className={`hover:text-[#06A475] transition-colors ${activeSection === "demo"
                  ? "text-[#06A475] font-medium underline underline-offset-4 "
                  : "text-gray-700"
                  }`}
              >
                Solution
              </button>
              <button
                onClick={() => scrollToSection("pricing")}
                className={`hover:text-[#06A475] transition-colors ${activeSection === "pricing"
                  ? "text-[#06A475] font-medium underline underline-offset-4 "
                  : "text-gray-700"
                  }`}
              >
                Pricing
              </button>
              <button
                onClick={() => scrollToSection("contact")}
                className={`hover:text-[#06A475] transition-colors ${activeSection === "contact"
                  ? "text-[#06A475] font-medium underline underline-offset-4 "
                  : "text-gray-700"
                  }`}
              >
                Contact Us
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-between justify-between space-x-4">
                <span className="text-sm text-gray-600 flex items-center ">
                  <Phone className="w-4 h-4 mr-1" />
                  +1 (940) 595-6020
                </span>
                <Button className="relative group text-white overflow-hidden px-4 py-2 rounded-full cursor-pointer" onClick={handleDemoRequest}>
                  <span className="absolute inset-0 bg-gradient-to-br from-[#06A475] to-[#09503B] transition-all duration-300 group-hover:from-[#0BA37F] group-hover:to-[#0A6A4E]" />
                  <span className="relative z-10">Request a Demo</span>
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t pt-4">
              <nav className="flex flex-col space-y-4">
                <button
                  onClick={() => scrollToSection("home")}
                  className={`text-left hover:text-[#06A475] transition-colors ${activeSection === "home" ? "text-[#06A475] font-medium" : "text-gray-700"
                    }`}
                >
                  Home
                </button>
                <button
                  onClick={() => scrollToSection("features")}
                  className={`text-left hover:text-[#06A475] transition-colors ${activeSection === "features" ? "text-[#06A475] font-medium" : "text-gray-700"
                    }`}
                >
                  Features
                </button>
                <button
                  onClick={() => scrollToSection("demo")}
                  className={`text-left hover:text-[#06A475] transition-colors ${activeSection === "demo" ? "text-[#06A475] font-medium" : "text-gray-700"
                    }`}
                >
                  Solution
                </button>
                <button
                  onClick={() => scrollToSection("pricing")}
                  className={`text-left hover:text-[#06A475] transition-colors ${activeSection === "pricing" ? "text-[#06A475] font-medium" : "text-gray-700"
                    }`}
                >
                  Pricing
                </button>
                 <button
                  onClick={() => scrollToSection("contact")}
                  className={`text-left hover:text-[#06A475] transition-colors ${activeSection === "contact" ? "text-[#06A475] font-medium" : "text-gray-700"
                    }`}
                >
                  Contact Us
                </button>
                <div className="flex items-center space-x-4">
                  <Button className="w-full relative group text-white overflow-hidden px-4 py-2 rounded-md" onClick={handleDemoRequest}>
                    <span className="absolute inset-0 bg-gradient-to-br from-[#06A475] to-[#09503B] transition-all duration-300 group-hover:from-[#0BA37F] group-hover:to-[#0A6A4E]" />
                    <span className="relative z-10">Request a Demo</span>
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="bg-gradient-to-br from-[#06A475] to-[#09503B] text-white pt-24 pb-16">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[80vh]">
            {/* Left Column: Text */}
            <div className="space-y-6 text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
                Smart Dental
              
                Practice
                <br />
                Management
                <br />
                Software
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-green-100  mx-auto lg:mx-0">
                Transform your dental practice to next level with the best practice management software. You deserve it.
              </p>
            </div>

            {/* Right Column: Image */}
            <div className="flex items-center justify-center h-[70vh] min-h-[500px]">
              <img
                src="/mockup.png"
                alt="Dentax Hero Image"
                className="h-full w-auto max-w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Key Features</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            <Card className="text-center p-4 sm:p-6">
              <CardContent className="space-y-4">
                <div className="w-24 h-24 sm:w-16 sm:h-16 bg-green-100 rounded-lg mx-auto flex items-center justify-center">
                  <img
                    src="/DICOM.png"
                    alt=" DICOM Imaging Viewer"
                    className="w-12 h-12 sm:w-8 sm:h-8 text-[#06A475]"
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900"> DICOM Imaging Viewer</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Upload, view, and annotate X-rays and dental scans securely.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-4 sm:p-6 ">
              <CardContent className="space-y-4">
                <div className="w-24 h-24 sm:w-16 sm:h-16 bg-green-100 rounded-lg mx-auto flex items-center justify-center">
                  <img
                    src="/BILLING.png"
                    alt=" DICOM Imaging Viewer"
                    className="w-12 h-12 sm:w-8 sm:h-8 text-[#06A475]"
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Billing & Invoicing</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Auto-generate invoices, manage payments, and generate receipts.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-4 sm:p-6">
              <CardContent className="space-y-4">
                <div className="w-24 h-24 sm:w-16 sm:h-16 bg-green-100 rounded-lg mx-auto flex items-center justify-center">
                  <img
                    src="/APPOINTMENT.png"
                    alt=" DICOM Imaging Viewer"
                    className="w-12 h-12 sm:w-8 sm:h-8 text-[#06A475]"
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Appointment Scheduling</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Real-time booking with calendar view, reminders, and queue tracking.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-4 sm:p-6">
              <CardContent className="space-y-4">
                <div className="w-24 h-24 sm:w-16 sm:h-16 bg-green-100 rounded-lg mx-auto flex items-center justify-center">
                  <img
                    src="/INVENTORY.png"
                    alt=" DICOM Imaging Viewer"
                    className="w-12 h-12 sm:w-8 sm:h-8 text-[#06A475]"
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Inventory Management</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Track dental supplies, auto-alerts for low stock, and purchase orders.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-4 sm:p-6 1">
              <CardContent className="space-y-4">
                <div className="w-24 h-24 sm:w-16 sm:h-16 bg-green-100 rounded-lg mx-auto flex items-center justify-center">
                  <img
                    src="/PATIENT.png"
                    alt=" DICOM Imaging Viewer"
                    className="w-12 h-12 sm:w-8 sm:h-8 text-[#06A475]"
                  />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Patient Management</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Maintain detailed dental records, medical history, and visit logs.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-4 sm:p-6 ">
              <CardContent className="space-y-4">
                <div className="w-24 h-24 sm:w-16 sm:h-16 bg-green-100 rounded-lg mx-auto flex items-center justify-center">
                  <img src="/HR.png" alt=" DICOM Imaging Viewer" className="w-12 h-12 sm:w-8 sm:h-8 text-[#06A475]" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">HR & Payroll</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Manage attendance, leaves, and automate monthly payroll.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* See Dentax in Action Section */}
      <section id="demo" className="bg-gradient-to-br from-[#06A475] to-[#09503B] text-white py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">See Dentax in Action</h2>
            <p className="text-green-100 max-w-3xl mx-auto text-sm sm:text-base lg:text-lg">
              Dentax is optimized for desktops, laptops, and tablets. Experience a modern, responsive interface that
              works seamlessly across devices.
            </p>
          </div>
          <div className="flex justify-center">
            <img src="/ACTION.png" alt="Demo Video Thumbnail" className="w-full max-w-2xl " />
          </div>
          <div className="flex justify-center">
            <Button className="rounded-full cursor-pointer bg-white text-emerald-500 hover:bg-gray-100" onClick={redirectToLogin}>Visit Site</Button>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Pricing</h2>
            <p className="text-gray-600 text-sm sm:text-base mb-8">Choose the perfect plan for your practice</p>

            {/* Pricing Toggle */}
            <div className="flex flex-col items-center justify-center mb-8 space-y-2">
              {/* Toggle switch row */}
              {/*
              <div className="flex items-center space-x-4">
                <span className={`text-sm font-medium ${!isYearly ? "text-[#06A475]" : "text-gray-500"}`}>Monthly</span>
                <button
                  onClick={() => setIsYearly(!isYearly)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#06A475] focus:ring-offset-2 ${isYearly ? "bg-[#06A475]" : "bg-gray-200"
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isYearly ? "translate-x-6" : "translate-x-1"
                      }`}
                  />
                </button>
                <span className={`text-sm font-medium ${isYearly ? "text-[#06A475]" : "text-gray-500"}`}>Yearly</span>
              </div>*/}

              {/* Badge row */}
              {isYearly && (
                <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
                  Save 20%
                </Badge>
              )}
            </div>

          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {/* Basic Plan */}
            <Card className={cn(
              "relative p-6 lg:p-8 hover:shadow-lg transition-shadow duration-300 cursor-pointer",
              activePlan === "basic" ? "scale-105 ring-2 ring-[#06A475]" : ""
            )} onClick={() => { setActivePlan("basic") }}>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Basic</h3>
                  {/*
                  <div className="mt-4">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900">${isYearly ? "23" : "29"}</span>
                    <span className="text-gray-600">/{isYearly ? "month" : "month"}</span>
                    {isYearly && <div className="text-sm text-gray-500 mt-1">Billed annually (${23 * 12}/year)</div>}
                  </div>
                  */}

                  <div className="mt-4">
                    <span className="text-gray-700 text-sm sm:text-base">Ideal for solo dentists or small clinics with limited operational requirements.
                      Core Features</span>
                  </div>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Appointment Scheduling </span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Patient Record Management </span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Invoice & Billing Management </span>
                  </li>
                  <li className="flex flex-col items-start">
                    <div className="flex items-center">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                      <span className="text-gray-700 text-sm sm:text-base">Role-Based Access (2 user roles)</span>
                    </div>
                    <ul className="ml-8 mt-1 space-y-1">
                      <li className="text-gray-500 text-xs sm:text-sm">• Admin</li>
                      <li className="text-gray-500 text-xs sm:text-sm">• Dentist</li>
                    </ul>
                  </li>

                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Email-Based Support</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Add-on option for any available module of Dentax custom quote</span>
                  </li>
                </ul>

                <Button
                  className={cn(
                    "w-full cursor-pointer",
                    activePlan === "basic"
                      ? "hover:bg-gradient-to-r hover:from-[#058a66] hover:to-[#0a4532] hover:text-white"
                      : "opacity-50"
                  )}
                  variant="outline"
                  disabled={activePlan !== "basic"}
                  onClick={()=>{handlePurchaseRequest("Basic")}}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className={cn(
              "relative p-6 lg:p-8 border-2 hover:shadow-lg transition-shadow duration-300 cursor-pointer",
              activePlan === "pro"
                ? "border-[#06A475] scale-105 ring-2 ring-[#06A475]"
                : "border-transparent"
            )} onClick={() => { setActivePlan("pro") }}>
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-[#06A475] to-[#09503B]">
                Most Popular
              </Badge>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Pro</h3>
                  {/*
                  <div className="mt-4">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900">${isYearly ? "47" : "59"}</span>
                    <span className="text-gray-600">/{isYearly ? "month" : "month"}</span>
                    {isYearly && <div className="text-sm text-gray-500 mt-1">Billed annually (${47 * 12}/year)</div>}
                  </div>
                  */}
                  <div className="mt-4">
                    <span className="text-gray-700 text-sm sm:text-base">Ideal for medium-sized dental practices with moderate staff and patient volume</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-gray-700 text-sm sm:text-base">Includes Everything in BASIC, plus</span>
                  </div>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Lab Integration Module</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Basic HR Management</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Inventory & Stock Control </span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Medical Imaging Studies Module</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Enhanced Role-Based Access (Up to 5 roles)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Custom Invoice Templates</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Email & WhatsApp Support</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Configuration support</span>
                  </li>
                </ul>

                <Button
                  className={cn(
                    "w-full cursor-pointer",
                    activePlan === "pro"
                      ? "hover:bg-gradient-to-r hover:from-[#058a66] hover:to-[#0a4532] hover:text-white"
                      : "opacity-50"
                  )}
                  variant="outline"
                  disabled={activePlan !== "pro"}
                  onClick={()=>{handlePurchaseRequest("Pro")}}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className={cn(
              "relative p-6 lg:p-8 hover:shadow-lg transition-shadow duration-300 cursor-pointer",
              activePlan === "premium" ? "scale-105 ring-2 ring-[#06A475]" : ""
            )} onClick={() => { setActivePlan("premium") }}>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">ENTERPRISE PACKAGE</h3>
                  {/*
                  <div className="mt-4">
                    <span className="text-3xl sm:text-4xl font-bold text-gray-900">${isYearly ? "79" : "99"}</span>
                    <span className="text-gray-600">/{isYearly ? "month" : "month"}</span>
                    {isYearly && <div className="text-sm text-gray-500 mt-1">Billed annually (${79 * 12}/year)</div>}
                    <div className="mt-4">
                      <span className="text-gray-700 text-sm sm:text-base">Medium-sized dental practices with moderate staff and patient volume</span>
                    </div>
                    <div className="mt-4">
                      <span className="text-gray-700 text-sm sm:text-base">Includes Everything in BASIC, plus</span>
                    </div>
                  </div>*/}
                   <div className="mt-4">
                    <span className="text-gray-700 text-sm sm:text-base">Ideal for large clinics, dental hospitals, or chains with multiple departments/sites</span>
                  </div>
                  <div className="mt-4">
                    <span className="text-gray-700 text-sm sm:text-base">Includes Everything in PRO, plus</span>
                  </div>
                </div>

                <ul className="space-y-3">
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Multi-Location Support</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Advanced HR Management</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Integrated Expense Management</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Unlimited Role-Based Access</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Advanced Analytics & Financial Reports</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Full Audit Logs & Compliance Tools</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">API Access & 3rd Party Integrations</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Dedicated Account Manager</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">24/7 Phone + Onsite Support</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Full data migration & validation</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Department-wise training programs</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-[#06A475] mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">Custom workflow and branding setup</span>
                  </li>
                </ul>

                <Button
                  className={cn(
                    "w-full cursor-pointer",
                    activePlan === "premium"
                      ? "hover:bg-gradient-to-r hover:from-[#058a66] hover:to-[#0a4532] hover:text-white"
                      : "opacity-50"
                  )}
                  variant="outline"
                  disabled={activePlan !== "premium"}
                  onClick={()=>{handlePurchaseRequest("Premium")}}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact us section */}
      <section id="contact" className="py-16 lg:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Get in Touch</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Ready to transform your dental practice? We're here to help you get started with Dentax.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Email */}
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Email Us</h3>
              <p className="text-gray-600">info@globalpearlventures.com</p>
            </div>
            
            {/* Phone */}
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Call Us</h3>
              <p className="text-gray-600">We'll contact you back</p>
            </div>
            
            {/* Business Hours */}
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Business Hours</h3>
              <p className="text-gray-600">Mon - Fri: 9AM - 6PM</p>
            </div>
          </div>
          
          <div className="text-center">
            <Button 
              onClick={() => setOpenContactForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg font-semibold rounded-lg transition-colors duration-200 inline-flex items-center gap-2"
            >
              <MessageSquare className="w-5 h-5" />
              Send us a Message
            </Button>
            <p className="text-gray-500 text-sm mt-4">
              Or click on any pricing plan above to get started with a specific package
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-4 border-t">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center">

            <p className="text-gray-600 text-sm">© 2025 Dentax. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {openContactForm && <ContactForm
        setOpenContactForm={setOpenContactForm}
        subjectProp={subject}
        pricingPlanProp={pricingPlan}
      />}
    </div>
  )
}