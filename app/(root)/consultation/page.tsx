import { Mail, MapPin, MessageSquare, PhoneIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ContactForm from "@/components/ContactForm";

export default function page() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-12 bg-transparent">
      {/* Contact Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Contact Information */}
        <Card className="p-6 border-0 shadow-none bg-transparent">
          <CardHeader className="px-0">
            <CardTitle className="text-2xl font-light tracking-tight text-white">
              Get in Touch
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="space-y-8">
              <div className="flex items-start space-x-3 group">
                <MapPin className="h-5 w-5 text-neutral-200 mt-1 group-hover:text-neutral-400 transition-colors" />
                <div>
                  <h3 className="font-medium text-sm text-neutral-200 mb-1">
                    Address
                  </h3>
                  <p className="text-sm text-neutral-300">
                    Tanah Abang, Central Jakarta, DKI Jakarta, Indonesia
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 group">
                <PhoneIcon className="h-5 w-5 text-neutral-200 mt-1 group-hover:text-neutral-400 transition-colors" />
                <div>
                  <h3 className="font-medium text-sm text-neutral-200 mb-1">
                    Phone
                  </h3>
                  <p className="text-sm text-neutral-300">+62 896-4355-8982</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 group">
                <Mail className="h-5 w-5 text-neutral-200 mt-1 group-hover:text-neutral-400 transition-colors" />
                <div>
                  <h3 className="font-medium text-sm text-neutral-200 mb-1">
                    Email
                  </h3>
                  <p className="text-sm text-neutral-300">
                    <a
                      href="mailto:riqyuzet@gmail.com"
                      className="text-neutral-300"
                    >
                      riqyuzet@gmail.com
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 group">
                <MessageSquare className="h-5 w-5 text-neutral-200 mt-1 group-hover:text-neutral-400 transition-colors" />
                <div>
                  <h3 className="font-medium text-sm text-neutral-200 mb-1">
                    Social Media
                  </h3>
                  <p className="text-sm text-neutral-300">
                    <a
                      target="_blank"
                      href="https://www.instagram.com/onecarbon.id?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                      className="text-neutral-300"
                    >
                      @onecarbon.id
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <ContactForm />
      </div>

      {/* Map Section */}
      <div className="mb-0 mt-12 h-[400px] w-full rounded-lg overflow-hidden">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.358870133138!2d106.81297867461336!3d-6.216314993771629!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f6aae916029f%3A0x9b2b9acc262ce5ba!2sJAKARTA%20MORI%20TOWER!5e0!3m2!1sid!2sid!4v1739530620258!5m2!1sid!2sid&mode=dark"
          width="100%"
          height="40%"
          style={{
            border: 0,
            filter:
              "invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)",
          }}
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Office Location"
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
