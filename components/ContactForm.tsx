"use client"; // Ensure this runs on the client side

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  // Handle input changes
  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  }

  // Handle form submission (open mail client)
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault(); // Prevent actual form submission

    // Construct mailto URL
    const emailBody = `
Name: ${formData.name}
Email: ${formData.email}
Phone: ${formData.phone}

Message:
${formData.message}
    `.trim();

    const mailtoUrl = `mailto:riqyuzet@gmail.com?subject=Contact Form Submission from ${encodeURIComponent(
      formData.name
    )}&body=${encodeURIComponent(emailBody)}`;

    // Open the user's email client
    window.location.href = mailtoUrl;
  }

  return (
    <Card className="p-6 border-0 shadow-none bg-transparent text-white">
      <CardHeader className="px-0">
        <CardTitle className="text-2xl font-light tracking-tight">
          Send Message
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 sm:space-y-6">
            <Input
              name="name"
              placeholder="Name"
              required
              onChange={handleChange}
              className="text-black"
            />
            <Input
              name="email"
              type="email"
              placeholder="Email"
              required
              onChange={handleChange}
              className="text-black"
            />
            <Input
              name="phone"
              type="tel"
              placeholder="Phone Number"
              required
              onChange={handleChange}
              className="text-black"
            />
            <Textarea
              name="message"
              placeholder="Message"
              required
              onChange={handleChange}
              className="text-white"
            />
          </div>
          <Button type="submit" className="w-full bg-white text-black">
            Send Message
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
