import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { Loader2, Check, AlertCircle, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Course {
  id: number;
  course_name: string;
  course_code: string;
  description?: string;
  price?: number;
  instructor?: string;
}

interface EnrollmentState {
  step: "review" | "payment" | "processing" | "success";
  courseId: number;
}

type ApiError = { response?: { data?: { message?: string } } };

export default function EnrollmentCheckout() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<EnrollmentState>({
    step: "review",
    courseId: courseId ? parseInt(courseId) : 0,
  });
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/courses/${courseId}`);
        setCourse(data);
      } catch (error) {
        const message = (error as ApiError).response?.data?.message || "Failed to load course details";
        toast.error(message);
        navigate("/courses");
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId, navigate]);

  const handleEnrollment = async () => {
    try {
      setProcessingPayment(true);
      setState((prev) => ({ ...prev, step: "processing" }));
      // Create enrollment record (no payment required)
      await api.post(`/enrollments/checkout`, {
        course_id: Number(courseId),
        amount_paid: 0,
      });

      setState((prev) => ({ ...prev, step: "success" }));
      toast.success("Successfully enrolled in course!");

      setTimeout(() => {
        navigate(`/lms/courses/${courseId}`);
      }, 2000);
    } catch (error) {
      const message = (error as ApiError).response?.data?.message || "Enrollment failed. Please try again.";
      toast.error(message);
      setState((prev) => ({ ...prev, step: "review" }));
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">Loading course details...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 mx-auto text-red-600" />
          <p className="text-gray-600 dark:text-gray-400">Course not found</p>
          <Button
            onClick={() => navigate("/courses")}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-600 dark:text-gray-400 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Enrollment Checkout
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete your enrollment for this course
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Step Indicator */}
            <div className="flex gap-8">
              {["review", "payment", "processing", "success"].map((step, idx) => (
                <div key={step} className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                      state.step === step
                        ? "bg-blue-600 text-white"
                        : ["review", "payment", "processing"].includes(state.step) &&
                            ["review", "payment", "processing"].indexOf(state.step) >=
                              ["review", "payment", "processing", "success"].indexOf(step)
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {["review", "payment", "processing", "success"].indexOf(state.step) >
                    ["review", "payment", "processing", "success"].indexOf(step) ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </span>
                </div>
              ))}
            </div>

            {/* Content based on Step */}
            {state.step === "review" && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-8 space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Review Course</h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-start pb-4 border-b border-gray-200 dark:border-slate-700">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {course.course_name}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                        {course.course_code}
                      </p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                      New Course
                    </Badge>
                  </div>

                  {course.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Description
                      </label>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">{course.description}</p>
                    </div>
                  )}

                  {course.instructor && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Instructor
                      </label>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">{course.instructor}</p>
                    </div>
                  )}
                </div>

                <Button
                  onClick={handleEnrollment}
                  disabled={processingPayment}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enrolling...
                    </>
                  ) : (
                    "Confirm Enrollment"
                  )}
                </Button>
              </div>
            )}

            {state.step === "success" && (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Enrollment Complete!
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    You have successfully enrolled in {course.course_name}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    You will be redirected to the course shortly...
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 sticky top-4 space-y-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Order Summary</h3>

              <div className="space-y-4 pb-4 border-b border-gray-200 dark:border-slate-700">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{course.course_code}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{course.course_name}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Course Price</span>
                  <span>${course.price || 0}</span>
                </div>
                <div className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>Tax (0%)</span>
                  <span>$0</span>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 flex justify-between items-center">
                <span className="font-bold text-gray-900 dark:text-white">Total</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${course.price || 0}
                </span>
              </div>

              {/* Benefits */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">What's Included</h4>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Full course access</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>All course materials</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Certificate of completion</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Lifetime access</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
