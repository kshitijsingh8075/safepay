import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { AlertCircle, Upload, Check, Loader2, AlertTriangle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import MainLayout from "@/layouts/main-layout";

const WhatsAppCheck = () => {
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setImage(selectedFile);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!image && !description) {
      toast({
        title: "Input required",
        description: "Please provide a screenshot or message description",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    setResult(null);

    try {
      // Create form data for file upload
      const formData = new FormData();
      if (image) {
        formData.append("image", image);
      }
      formData.append("description", description);

      const response = await fetch("/api/analyze-whatsapp", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error analyzing message");
      }

      const data = await response.json();
      setResult(data);
      
      // Show toast based on result
      if (data.is_scam) {
        toast({
          title: "Warning: Potential Scam Detected",
          description: `Confidence: ${Math.round(data.confidence * 100)}%`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Message appears legitimate",
          description: `Confidence: ${Math.round(data.confidence * 100)}%`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Analysis failed",
        description: "An error occurred while analyzing the message",
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const resetForm = () => {
    setImage(null);
    setImagePreview(null);
    setDescription("");
    setResult(null);
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4 max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">WhatsApp Message Check</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Analyze WhatsApp Messages</CardTitle>
            <CardDescription>
              Upload a screenshot or provide the message text to check for potential scams
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="upload">Upload Screenshot (Optional)</Label>
              <input
                type="file"
                id="upload"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                ref={fileInputRef}
              />
              
              <div 
                onClick={triggerFileInput}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {imagePreview ? (
                  <div className="space-y-2">
                    <img 
                      src={imagePreview} 
                      alt="WhatsApp message preview" 
                      className="max-h-40 mx-auto rounded"
                    />
                    <p className="text-sm text-muted-foreground">Click to change</p>
                  </div>
                ) : (
                  <div className="py-4">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p>Click to upload a screenshot</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Message Text (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Paste the message content or describe what it says..."
                value={description}
                onChange={handleDescriptionChange}
                rows={4}
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-3">
            <div className="flex w-full space-x-2">
              <Button variant="outline" onClick={resetForm} className="flex-1">
                Reset
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={analyzing || (!image && !description)}
                className="flex-1 bg-primary"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Message"
                )}
              </Button>
            </div>
            
            {result && (
              <div className={`w-full p-3 rounded-lg ${result.is_scam ? 'bg-red-50' : 'bg-green-50'}`}>
                <div className="flex items-start">
                  {result.is_scam ? (
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                  ) : (
                    <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                  )}
                  <div>
                    <h3 className={`font-medium ${result.is_scam ? 'text-red-800' : 'text-green-800'}`}>
                      {result.is_scam ? 'Potential Scam Detected' : 'Message Appears Safe'}
                    </h3>
                    <p className="text-sm mt-1">
                      {result.is_scam ? result.scam_type : 'No suspicious patterns detected'}
                    </p>
                    
                    {result.scam_indicators && result.scam_indicators.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">Warning signs:</p>
                        <ul className="text-xs list-disc list-inside">
                          {result.scam_indicators.map((indicator: string, idx: number) => (
                            <li key={idx} className="ml-2">{indicator}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <p className="text-xs mt-2">
                      Confidence: {Math.round(result.confidence * 100)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
};

export default WhatsAppCheck;