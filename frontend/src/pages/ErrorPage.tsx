import { useRouteError } from "react-router";
import { Button } from "@/components/ui/button";
import { AlertCircle, ChevronLeft } from "lucide-react";

export default function ErrorPage() {
  const error = useRouteError() as any;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-full">
            <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            {error?.status === 404 ? "Page Not Found" : "Error"}
          </h1>
          <p className="text-muted-foreground">
            {error?.status === 404
              ? "The page you're looking for doesn't exist."
              : error?.statusText || "Something went wrong"}
          </p>
          {error?.data && (
            <p className="text-sm text-muted-foreground mt-4 p-3 bg-muted rounded">
              {error.data}
            </p>
          )}
        </div>

        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Button onClick={() => (window.location.href = "/dashboard")}>
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
