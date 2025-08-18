import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { Mail, Phone, Building, MessageSquare, X, Send } from "lucide-react";
import { toast } from "sonner";

interface ContactFormProps {
    setOpenContactForm: Dispatch<SetStateAction<boolean>>;
    subjectProp?: string;
    messageProp?: string;
    pricingPlanProp?: string;
}

export default function ContactForm({ setOpenContactForm, subjectProp, pricingPlanProp }: ContactFormProps) {
    const [name, setName] = useState("");
    const [contactNo, setContactNo] = useState("");
    const [organization, setOrganization] = useState("");
    const [pricingPlan] = useState(pricingPlanProp);
    const [message, setMessage] = useState("");
    const [subject, setSubject] = useState(subjectProp || "Dentax Inquiry");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) {
            toast.error("Please enter your name");
            return;
        }
        
        if (!subject.trim()) {
            toast.error("Please enter a subject");
            return;
        }
        
        if (!message.trim()) {
            toast.error("Please enter a message");
            return;
        }

        setIsSubmitting(true);
        
        try {
            const to = "naveensandaru2@gmail.com";
            const emailSubject = encodeURIComponent(subject);
            const emailBody = encodeURIComponent(message);
            const mailtoLink = `mailto:${to}?subject=${emailSubject}&body=${emailBody}`;
            
            window.location.href = mailtoLink;
            toast.success("Opening your email client...");
            
            // Close form after a short delay
            setTimeout(() => {
                closeContactForm();
            }, 1000);
        } catch (error) {
            toast.error("Failed to open email client");
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeContactForm = () => {
        setName("");
        setContactNo("");
        setOrganization("");
        setMessage("");
        setSubject(subjectProp || "Dentax Inquiry");
        setOpenContactForm(false);
    };

    useEffect(() => {
        const updatedParagraph = `Dear Mr/Mrs,

I am writing this email to express my interest in Dentax Smart Dental Practice Management Software system.
${organization ? `I am a representative of ${organization} and I would like to discuss with you about how to` : "I am an individual who is interested to discuss with you about how to"}${pricingPlan ? ` purchase the product, specifically the ${pricingPlan} package.` : " view a demonstration of the system."}
You can reach back to me through this email ${contactNo ? `or with this phone number: ${contactNo}.` : "."}

Hoping to receive a response soon.
${name ? `Yours truly,\n${name}` : "Best Regards."}`;

        setMessage(updatedParagraph);
    }, [name, contactNo, organization, pricingPlan]);

    return (
        <Dialog open={true} onOpenChange={(open) => !open && closeContactForm()}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="space-y-3">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
                            <MessageSquare className="w-6 h-6" />
                            Get in Touch
                        </DialogTitle>
                        
                    </div>
                    <DialogDescription className="text-gray-600 text-base">
                        We'd love to hear from you! Fill out the form below and we'll get back to you as soon as possible.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-6 mt-6">
                    {/* Contact Info Card */}
                    <div className="lg:col-span-1">
                        <Card className="h-fit">
                            <CardContent className="p-6 items-center justify-center space-y-4">
                                <h3 className="font-semibold text-lg mb-4 text-emerald-600">Contact Information</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Mail className="w-5 h-5 text-emerald-500" />
                                        <div>
                                            <p className="font-medium">Email</p>
                                            <p className="text-sm">info@globalpearlventures.com</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Phone className="w-5 h-5 text-emerald-500" />
                                        <div>
                                            <p className="font-medium">Phone</p>
                                            <p className="text-sm">We'll contact you back</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <Building className="w-5 h-5 text-emerald-500" />
                                        <div>
                                            <p className="font-medium">Business Hours</p>
                                            <p className="text-sm">Mon - Fri: 9AM - 6PM</p>
                                        </div>
                                    </div>
                                </div>
                                
                                {pricingPlan && (
                                    <div className="mt-6 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                        <p className="text-sm font-medium text-emerald-700">Selected Plan:</p>
                                        <p className="text-emerald-600 font-semibold">{pricingPlan}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Name and Contact Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-emerald-600 font-medium">
                                        Full Name *
                                    </Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Enter your full name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactNo" className="text-emerald-600 font-medium">
                                        Contact Number
                                    </Label>
                                    <Input
                                        id="contactNo"
                                        type="tel"
                                        placeholder="Enter your phone number"
                                        value={contactNo}
                                        onChange={(e) => setContactNo(e.target.value)}
                                        className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* Organization and Subject Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="organization" className="text-emerald-600 font-medium">
                                        Organization
                                    </Label>
                                    <Input
                                        id="organization"
                                        type="text"
                                        placeholder="Your organization name"
                                        value={organization}
                                        onChange={(e) => setOrganization(e.target.value)}
                                        className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject" className="text-emerald-600 font-medium">
                                        Subject *
                                    </Label>
                                    <Input
                                        id="subject"
                                        type="text"
                                        placeholder="Enter subject"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Message */}
                            <div className="space-y-2">
                                <Label htmlFor="message" className="text-emerald-600 font-medium">
                                    Message *
                                </Label>
                                <Textarea
                                    id="message"
                                    placeholder="Tell us about your requirements..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    className="min-h-[120px] border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 resize-none"
                                    required
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeContactForm}
                                    className="border-gray-300 hover:bg-gray-50"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Sending...
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Send className="w-4 h-4" />
                                            Send Message
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}