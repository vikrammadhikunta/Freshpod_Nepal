import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";

const BASE_URL = "http://localhost:3000";

function Success() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [machineId, setMachineId] = useState(null);

  useEffect(() => {
    const pidx = params.get("pidx");

    if (pidx) {
      verifyPayment(pidx);
    } else {
      setIsVerifying(false);
      setErrorMessage("No payment identification found.");
    }
  }, [params]);

  const verifyPayment = async (pidx) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/verify-khalti-payment`, { pidx });
      if (response.data.machineId) {
      setMachineId(response.data.machineId);
    }
      if (response.data.success) {
        setIsSuccess(true);


      } else {
        setIsSuccess(false);
        setErrorMessage("Verification failed. Transaction not completed.");
      }
    } catch (error) {
      setIsSuccess(false);
      setErrorMessage(error.response?.data?.message || "Server error.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTryAgain = () => {
    if (machineId) {
      navigate(`/?id=${machineId}`);
    } else {
      navigate("/");
    }
  };

  const handleGoHome = () => {
    if (machineId) {
      navigate(`/?id=${machineId}`);
    } else {
      navigate("/");
    }
  };

  // 1. Loading UI
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center animate-slideUp">
          <div className="relative">
            {/* Animated spinner */}
            <div className="w-20 h-20 mx-auto relative">
              <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mt-6 mb-2">Verifying Payment</h2>
            <p className="text-gray-500">Please wait while we confirm your transaction...</p>
          </div>
          
          {/* Loading steps */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-600">Checking payment status</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span className="text-gray-400">Updating machine status</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
              <span className="text-gray-400">Preparing disinfection</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Success UI
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center p-4">
        <div className="max-w-md w-full animate-slideUp">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-4 animate-bounceIn">
                  <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Payment Successful!</h1>
                <p className="text-green-100">Thank you for your payment</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Success Message Card */}
              <div className="bg-green-50 rounded-xl p-5 text-center">
                <p className="text-gray-700 leading-relaxed">
                  Your helmet disinfection process will start shortly. 
                  Please wait for the machine to activate.
                </p>
              </div>

              {/* Transaction Details Placeholder */}
              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Transaction Status</span>
                  <span className="text-green-600 font-semibold">Completed</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-500">Service</span>
                  <span className="text-gray-700">Freshpod Disinfection</span>
                </div>
              </div>

              {/* What's Next Section */}
              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  What's Next?
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-purple-600 font-bold">1</span>
                    </div>
                    <p className="text-sm text-gray-600">Place your helmet inside the Freshpod machine</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-purple-600 font-bold">2</span>
                    </div>
                    <p className="text-sm text-gray-600">Close the lid securely</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-purple-600 font-bold">3</span>
                    </div>
                    <p className="text-sm text-gray-600">The Helmet disinfection will start automatically</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button 
                  onClick={handleGoHome}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Back to Home
                </button>
                
                <button 
                  onClick={() => window.print()}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  Download Receipt
                </button>
              </div>

              {/* Footer Note */}
              <div className="text-center pt-2">
                <p className="text-xs text-gray-400">
                  A confirmation SMS has been sent to your registered number
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Failure/Cancel UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-400 to-pink-600 flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-slideUp">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Error Header */}
          <div className="bg-gradient-to-r from-red-500 to-pink-600 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-full mb-4">
                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Payment Failed</h1>
              <p className="text-red-100">We couldn't process your payment</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Error Message Card */}
            <div className="bg-red-50 rounded-xl p-5">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-700">
                  {errorMessage || "The transaction was canceled or declined. No charges have been made to your account."}
                </p>
              </div>
            </div>

            {/* Possible Reasons */}
            <div className="border-t border-gray-100 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Possible reasons:</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <span>Insufficient balance in wallet</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <span>Transaction timeout</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                  <span>Technical error from payment gateway</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button 
                onClick={handleTryAgain}
                className="w-full bg-gradient-to-r from-red-500 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-red-600 hover:to-pink-700 transition shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
              >
                Try Again
              </button>
              
              <button 
                onClick={handleGoHome}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition"
              >
                Go Back Home
              </button>
            </div>

            {/* Support Info */}
            <div className="text-center pt-2">
              <p className="text-xs text-gray-400">
                Need help? Contact our support team
              </p>
              <p className="text-xs text-purple-600 font-medium mt-1">
                support@freshpod.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Success;

<style jsx>{`
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes bounceIn {
    0% {
      opacity: 0;
      transform: scale(0.3);
    }
    50% {
      opacity: 1;
      transform: scale(1.05);
    }
    70% {
      transform: scale(0.9);
    }
    100% {
      transform: scale(1);
    }
  }
  
  .animate-slideUp {
    animation: slideUp 0.5s ease-out;
  }
  
  .animate-bounceIn {
    animation: bounceIn 0.6s ease-out;
  }
`}</style>