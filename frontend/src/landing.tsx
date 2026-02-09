import { Link } from "react-router-dom";
import { Button } from "@/ui/button";
import { Card, CardContent } from "@/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/ui/carousel";
import { Users, Lock, FileText, History } from "lucide-react";
import heroImage from "@/assets/dashboard.png";
import editorImage from "@/assets/editor.png";
import permissionsImage from "@/assets/share.png";
import versionImage from '@/assets/version.png';

const Landing = () => {
  const features = [
    {
      icon: Users,
      title: "Real-time Collaboration",
      description: "Work together seamlessly with CRDT-based conflict-free editing. See changes instantly as your friends type.",
      image: editorImage,
    },
    {
      icon: Lock,
      title: "Control your access",
      description: "Your documents are completely your own. Control who has access with granular permissions.",
      image: permissionsImage,
    },
    {
      icon: History,
      title: 'Create different versions',
      description: 'Manage different versions of your documents. Restore to previous versions as and when you like.',
      image: versionImage
    }
  ];

  return (
    <div className="min-h-screen">
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Colab</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/auth/login">
                <Button variant="ghost">Log In</Button>
              </Link>
              <Link to="/auth/register">
                <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Collaborate on 
                <span className="block">Documents Together</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl">
                Real-time collaboration and conflict-free editing
                supported by a custom CRDT
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/auth/register">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8">
                    Start Writing
                  </Button>
                </Link>
                <Link to="/auth/login">
                  <Button size="lg" variant="outline" className="text-lg px-8">
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src={heroImage}
                alt="Collaborative editing"
                className="rounded-2xl shadow-2xl border border-border"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything you need to collaborate
            </h2>
          </div>

          <Carousel className="max-w-5xl mx-auto">
            <CarouselContent>
              {features.map((feature, index) => (
                <CarouselItem key={index}>
                  <Card className="border-2">
                    <CardContent className="p-8">
                      <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-4">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
                            <feature.icon className="h-8 w-8 text-primary" />
                          </div>
                          <h3 className="text-3xl font-bold">{feature.title}</h3>
                          <p className="text-lg text-muted-foreground">{feature.description}</p>
                        </div>
                        <div>
                          <img
                            src={feature.image}
                            alt={feature.title}
                            className="rounded-xl shadow-lg border border-border"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-5"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ready to transform your document workflow?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join to collaborate seamlessly
            </p>
            <Link to="/auth/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-12">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-end">
            <p className="text-sm text-muted-foreground">
              Built by Jyotirmay Zamre
            </p> 
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
