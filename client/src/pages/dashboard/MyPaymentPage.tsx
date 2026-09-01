import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { UploadCloud, AlertCircle, CheckCircle, Clock, FileText } from 'lucide-react';
import Tesseract from 'tesseract.js';

export const MyPaymentPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: paymentData, isLoading: paymentLoading } = useQuery({
    queryKey: ['payment-status'],
    queryFn: async () => {
      const res = await api.payments.getMyStatus();
      return res.data;
    },
    staleTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  });

  const { data: bonafideData, isLoading: bonafideLoading } = useQuery({
    queryKey: ['bonafide-status'],
    queryFn: async () => {
      const res = await api.bonafides.getMy();
      return res.data;
    },
  });

  const [refNumber, setRefNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [bonafideFile, setBonafideFile] = useState<File | null>(null);
  const [isBonafideSubmitting, setIsBonafideSubmitting] = useState(false);

  const paymentStatus = paymentData?.status || 'NOT_SUBMITTED';
  const bonafideStatus = bonafideData?.status || 'NOT_SUBMITTED';

  const [isScanning, setIsScanning] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setReceiptFile(file);
      
      if (file.type.startsWith('image/')) {
        setIsScanning(true);
        try {
          const { data: { text } } = await Tesseract.recognize(file, 'eng');
          const matches = text.match(/\b\d{10,20}\b/g); 
          if (matches && matches.length > 0) {
            const likelyRef = matches.find(m => m.length >= 12) || matches[0];
            setRefNumber(likelyRef);
            alert(`Auto-detected reference number: ${likelyRef}.\nPlease verify it is correct.`);
          }
        } catch (error) {
          console.error('OCR Error:', error);
        } finally {
          setIsScanning(false);
        }
      }
    }
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refNumber || !paymentDate || !receiptFile) {
      alert('Please fill out all required fields and upload a receipt.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Upload file first
      const formData = new FormData();
      formData.append('receipt', receiptFile);
      
      const uploadRes = await api.uploads.uploadReceipt(formData);
      const receipt_url = uploadRes.data.url;

      // Submit payment details
      await api.payments.initiate({
        transaction_reference: refNumber,
        receipt_url,
        amount: 100,
        payment_date: paymentDate,
        payment_method: paymentMethod
      });

      alert('Payment details submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['payment-status'] });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit payment details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBonafideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBonafideFile(e.target.files[0]);
    }
  };

  const submitBonafide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonafideFile) {
      alert('Please upload a bonafide document.');
      return;
    }

    try {
      setIsBonafideSubmitting(true);
      
      const formData = new FormData();
      formData.append('bonafide', bonafideFile);
      
      const uploadRes = await api.uploads.uploadBonafide(formData);
      const file_url = uploadRes.data.url;

      await api.bonafides.upload({ file_url });

      alert('Bonafide document submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['bonafide-status'] });
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit bonafide document.');
    } finally {
      setIsBonafideSubmitting(false);
    }
  };

  if (paymentLoading || bonafideLoading) {
    return <div className="text-[#6B5A5C] font-mono text-xs text-center py-10">Loading status...</div>;
  }

  return (
    <div className="space-y-10 max-w-3xl mx-auto pb-12">
      <div>
        <h1 className="text-xl font-display font-bold text-[#F7F2F2]">Mandatory Documents & Payment</h1>
        <p className="text-xs text-[#6B5A5C] font-mono mt-1">Submit your symposium fee and bonafide document to unlock event registrations.</p>
      </div>

      {/* ── INSTRUCTIONS ── */}
      <div className="bg-[#1A1114] border border-[#2A1A1D] p-6 rounded-[2px] space-y-4">
        <h2 className="text-sm font-display font-bold text-[#E01B22] uppercase tracking-widest flex items-center gap-2">
          <FileText className="w-4 h-4" /> Registration & Payment Steps
        </h2>
        <ol className="list-decimal list-inside text-xs font-mono text-[#A79798] space-y-2 leading-relaxed">
          <li><strong>Open the Portal</strong>: Access the payment gateway through the provided portal link.</li>
          <li><strong>Fill the fields & verify</strong>: Complete your details on the external payment portal and verify them.</li>
          <li><strong>Make the payment</strong>: Complete the transaction, download the receipt, and refer to the receipt number.</li>
          <li><strong>Update the receipt number</strong>: Enter your receipt number below, upload the downloaded receipt, and submit to verify.</li>
        </ol>
      </div>

      {/* ── PAYMENT SECTION ── */}
      <div className="space-y-6">
      {paymentStatus === 'VERIFIED' && (
        <div className="bg-[#1FA971]/10 border border-[#1FA971] p-8 rounded-[2px] text-center space-y-4 shadow-[0_0_20px_rgba(31,169,113,0.15)]">
          <CheckCircle className="w-12 h-12 text-[#1FA971] mx-auto" />
          <div>
            <h2 className="text-lg font-display font-bold text-[#1FA971] tracking-wider">PAYMENT VERIFIED</h2>
            <p className="text-xs text-[#A79798] font-mono mt-2">Your registration payment has been approved.</p>
            <p className="text-xs text-[#A79798] font-mono mt-1">You can now proceed with event and team registration.</p>
          </div>
          <div className="pt-4">
            <a href="/dashboard/events" className="inline-block px-6 py-2.5 bg-[#1FA971] hover:bg-[#27C487] text-[#0A0607] font-mono text-xs font-bold uppercase rounded-[2px] transition-colors">
              BROWSE EVENTS →
            </a>
          </div>
        </div>
      )}

      {paymentStatus === 'PENDING' && (
        <div className="bg-[#130C0E] border border-[#E08A17] p-8 rounded-[2px] text-center space-y-4">
          <Clock className="w-12 h-12 text-[#E08A17] mx-auto" />
          <div>
            <h2 className="text-lg font-display font-bold text-[#E08A17] tracking-wider">VERIFICATION PENDING</h2>
            <p className="text-xs text-[#A79798] font-mono mt-2">Payment submitted successfully.</p>
            <p className="text-[10px] text-[#A79798] font-mono mt-1">Reference ID: {paymentData.transaction_reference}</p>
            <p className="text-xs text-[#A79798] font-mono mt-4 border-t border-[#2A1A1D] pt-4">Your payment is currently awaiting coordinator approval. This may take a few hours.</p>
          </div>
        </div>
      )}

      {(paymentStatus === 'NOT_SUBMITTED' || paymentStatus === 'REJECTED') && (
        <div className="space-y-6">
          {paymentStatus === 'REJECTED' && (
            <div className="bg-[#4A050A] border border-[#E01B22] p-5 rounded-[2px] flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-[#FF2A2A] shrink-0" />
              <div>
                <h3 className="text-sm font-display font-bold text-[#FF2A2A]">PAYMENT REJECTED</h3>
                <p className="text-xs text-[#F7F2F2] font-mono mt-1">Reason: {paymentData?.rejection_reason}</p>
                <p className="text-[10px] text-[#A79798] font-mono mt-2">Please correct the issue and resubmit your payment details below.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#130C0E] border border-[#2A1A1D] p-6 rounded-[2px] space-y-5">
              <h2 className="text-sm font-display font-bold text-[#E01B22] border-b border-[#2A1A1D] pb-3">
                PAYMENT INSTRUCTIONS
              </h2>
              
              <div className="space-y-4 font-mono text-xs text-[#A79798]">
                <div className="flex justify-between items-center bg-[#0A0607] p-3 border border-[#2A1A1D] rounded-[2px]">
                  <span>Registration Fee:</span>
                  <span className="text-lg font-bold text-[#F7F2F2]">₹100</span>
                </div>
                
                <div className="pt-2">
                  <p className="text-[#F7F2F2] font-bold mb-3">Pay via PSG Institutions Portal</p>
                  <p className="mb-4">Click the button below to open the official PSG payment gateway in a new tab. Complete your payment there.</p>
                  <a
                    href="https://events.psginstitutions.in/EMS/register/E5294158179"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 bg-[#E01B22] hover:bg-[#FF2A2A] text-[#F7F2F2] font-mono text-xs font-bold uppercase rounded-[2px] shadow-[0_0_15px_rgba(224,27,34,0.2)] transition-all"
                  >
                    OPEN PAYMENT PORTAL ↗
                  </a>
                </div>
                
                <div className="pt-5 border-t border-[#2A1A1D]">
                  <p className="text-[10px] text-[#E08A17] font-bold">IMPORTANT STEP</p>
                  <p className="text-[10px] mt-1">After completing the payment on the external portal, you MUST return here and submit your Transaction Reference Number and payment screenshot to get verified.</p>
                </div>

                <div className="pt-5 border-t border-[#2A1A1D]">
                  <p className="text-[10px] text-[#1FA971] font-bold">NEED HELP?</p>
                  <p className="text-[10px] mt-1">Stuck or facing issues with payment?</p>
                  <a
                    href="https://wa.me/919876543210"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 px-4 py-2 bg-[#1FA971]/10 border border-[#1FA971]/30 hover:bg-[#1FA971]/20 text-[#1FA971] font-mono text-[10px] font-bold uppercase rounded-[2px] transition-colors"
                  >
                    CONTACT US ON WHATSAPP 💬
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-[#130C0E] border border-[#2A1A1D] p-6 rounded-[2px]">
              <h2 className="text-sm font-display font-bold text-[#F7F2F2] border-b border-[#2A1A1D] pb-3 mb-5">
                SUBMIT PAYMENT DETAILS
              </h2>
              
              <form onSubmit={submitPayment} className="space-y-4 font-body text-xs">
                <div>
                  <label className="block text-[#A79798] mb-1.5 font-bold font-mono">Amount Paid *</label>
                  <input
                    type="text"
                    value="₹100"
                    disabled
                    className="w-full bg-[#0A0607] border border-[#2A1A1D] text-[#6B5A5C] p-2.5 rounded-[2px] outline-none font-mono cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#A79798] mb-1.5 font-bold font-mono">Payment Date *</label>
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      required
                      className="w-full bg-[#0A0607] border border-[#2A1A1D] focus:border-[#E01B22] text-[#F7F2F2] p-2.5 rounded-[2px] outline-none font-mono transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A79798] mb-1.5 font-bold font-mono">Method *</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-[#0A0607] border border-[#2A1A1D] focus:border-[#E01B22] text-[#F7F2F2] p-2.5 rounded-[2px] outline-none font-mono transition-colors"
                    >
                      <option value="UPI">UPI</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#A79798] mb-1.5 font-bold font-mono">Payment Screenshot / Receipt *</label>
                  <div className={`border-2 border-dashed ${isScanning ? 'border-[#E01B22] bg-[#E01B22]/5' : 'border-[#2A1A1D] hover:border-[#E01B22] bg-[#0A0607]'} p-4 text-center rounded-[2px] transition-colors relative`}>
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp, application/pdf"
                      onChange={handleFileChange}
                      required
                      disabled={isScanning}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <UploadCloud className={`w-6 h-6 mx-auto mb-2 ${isScanning ? 'text-[#E01B22] animate-pulse' : 'text-[#6B5A5C]'}`} />
                    <span className={`font-mono text-[10px] ${isScanning ? 'text-[#E01B22] font-bold' : 'text-[#A79798]'}`}>
                      {isScanning ? 'Scanning receipt for reference number...' : receiptFile ? receiptFile.name : 'Click or drag file to upload'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[#A79798] mb-1.5 font-bold font-mono">Receipt Number *</label>
                  <input
                    type="text"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    required
                    disabled={isScanning}
                    placeholder={isScanning ? 'Auto-fetching...' : 'e.g. 202608290010'}
                    className="w-full bg-[#0A0607] border border-[#2A1A1D] focus:border-[#E01B22] text-[#F7F2F2] p-2.5 rounded-[2px] outline-none font-mono transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 py-3 bg-[#E01B22] hover:bg-[#FF2A2A] disabled:opacity-50 text-[#F7F2F2] font-mono text-xs font-bold uppercase rounded-[2px] shadow-[0_0_15px_rgba(224,27,34,0.2)] transition-all"
                >
                  {isSubmitting ? 'SUBMITTING...' : 'SUBMIT FOR VERIFICATION'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* ── BONAFIDE SECTION ── */}
      <div className="space-y-6 border-t border-[#2A1A1D] pt-8">
        <h2 className="text-lg font-display font-bold text-[#F7F2F2]">Bonafide Document</h2>
        
        {bonafideStatus === 'verified' && (
          <div className="bg-[#1FA971]/10 border border-[#1FA971] p-6 rounded-[2px] flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-[#1FA971] shrink-0" />
            <div>
              <h2 className="text-sm font-display font-bold text-[#1FA971] tracking-wider">DOCUMENT VERIFIED</h2>
              <p className="text-xs text-[#A79798] font-mono mt-1">Your bonafide document has been approved by the registration team.</p>
            </div>
          </div>
        )}

        {(bonafideStatus === 'uploaded' || bonafideStatus === 'under_review') && (
          <div className="bg-[#130C0E] border border-[#E08A17] p-6 rounded-[2px] flex items-center gap-4">
            <Clock className="w-8 h-8 text-[#E08A17] shrink-0" />
            <div>
              <h2 className="text-sm font-display font-bold text-[#E08A17] tracking-wider">VERIFICATION PENDING</h2>
              <p className="text-xs text-[#A79798] font-mono mt-1">Your document is currently under review by the coordination team.</p>
            </div>
          </div>
        )}

        {(bonafideStatus === 'NOT_SUBMITTED' || bonafideStatus === 'rejected') && (
          <div className="space-y-6">
            {bonafideStatus === 'rejected' && (
              <div className="bg-[#4A050A] border border-[#E01B22] p-5 rounded-[2px] flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-[#FF2A2A] shrink-0" />
                <div>
                  <h3 className="text-sm font-display font-bold text-[#FF2A2A]">DOCUMENT REJECTED</h3>
                  <p className="text-xs text-[#F7F2F2] font-mono mt-1">Reason: {bonafideData?.remarks || 'Invalid document'}</p>
                  <p className="text-[10px] text-[#A79798] font-mono mt-2">Please upload a valid bonafide certificate from your college.</p>
                </div>
              </div>
            )}

            <div className="bg-[#130C0E] border border-[#2A1A1D] p-6 rounded-[2px]">
              <h2 className="text-sm font-display font-bold text-[#F7F2F2] border-b border-[#2A1A1D] pb-3 mb-5">
                UPLOAD BONAFIDE CERTIFICATE
              </h2>
              
              <form onSubmit={submitBonafide} className="space-y-4 font-body text-xs">
                <div>
                  <label className="block text-[#A79798] mb-1.5 font-bold font-mono">College Bonafide (PDF/Image) *</label>
                  <div className="border-2 border-dashed border-[#2A1A1D] hover:border-[#E01B22] bg-[#0A0607] p-6 text-center rounded-[2px] transition-colors relative">
                    <input
                      type="file"
                      accept="image/jpeg, image/png, image/webp, application/pdf"
                      onChange={handleBonafideChange}
                      required
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FileText className="w-8 h-8 text-[#6B5A5C] mx-auto mb-3" />
                    <span className="text-[#A79798] font-mono text-[11px] block">
                      {bonafideFile ? bonafideFile.name : 'Click or drag file to upload'}
                    </span>
                    <span className="text-[#6B5A5C] font-mono text-[9px] mt-2 block">
                      Max file size: 5MB. Ensure college seal and signature are clearly visible.
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBonafideSubmitting}
                  className="w-full mt-2 py-3 bg-[#E01B22] hover:bg-[#FF2A2A] disabled:opacity-50 text-[#F7F2F2] font-mono text-xs font-bold uppercase rounded-[2px] shadow-[0_0_15px_rgba(224,27,34,0.2)] transition-all"
                >
                  {isBonafideSubmitting ? 'UPLOADING...' : 'SUBMIT BONAFIDE DOCUMENT'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

    </div>

  );
};
