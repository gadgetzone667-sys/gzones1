import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Package, ArrowLeft, CreditCard, ShoppingBag, Loader2, Truck, Globe, MapPin, Building, UserCheck } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Saudi Arabia",
  "Singapore",
  "Malaysia",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Japan",
  "Qatar",
  "Oman",
  "Kuwait",
  "Bahrain",
  "Sri Lanka",
  "Bangladesh",
  "Nepal",
  "Bhutan",
  "Maldives",
  "Indonesia",
  "Thailand",
  "Philippines",
  "Vietnam",
  "South Korea",
  "Hong Kong",
  "Taiwan",
  "China",
  "New Zealand",
  "Italy",
  "Spain",
  "Netherlands",
  "Switzerland",
  "Sweden",
  "Norway",
  "Denmark",
  "Finland",
  "Ireland",
  "Belgium",
  "Austria",
  "Poland",
  "Portugal",
  "Greece",
  "Czech Republic",
  "Hungary",
  "Romania",
  "Turkey",
  "Israel",
  "South Africa",
  "Egypt",
  "Kenya",
  "Nigeria",
  "Mauritius",
  "Brazil",
  "Mexico",
  "Argentina",
  "Chile",
  "Colombia",
  "Peru",
  "Russian Federation",
  "Ukraine",
  "Pakistan",
  "Afghanistan",
  "Iran",
  "Iraq",
  "Jordan",
  "Lebanon",
  "Morocco",
  "Ghana",
  "Ethiopia",
  "Tanzania",
  "Uganda",
  "Zimbabwe"
];

const INDIAN_STATES = [
  "Tamil Nadu",
  "Maharashtra",
  "Karnataka",
  "Kerala",
  "Telangana",
  "Andhra Pradesh",
  "Delhi (NCT)",
  "Gujarat",
  "West Bengal",
  "Rajasthan",
  "Uttar Pradesh",
  "Punjab",
  "Haryana",
  "Madhya Pradesh",
  "Bihar",
  "Odisha",
  "Assam",
  "Chhattisgarh",
  "Jharkhand",
  "Uttarakhand",
  "Himachal Pradesh",
  "Goa",
  "Jammu and Kashmir",
  "Puducherry",
  "Chandigarh",
  "Arunachal Pradesh",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Sikkim",
  "Tripura",
  "Andaman and Nicobar Islands",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Ladakh",
  "Lakshadweep"
];

const INDIAN_CITIES_BY_STATE: Record<string, string[]> = {
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", 
    "Vellore", "Erode", "Thoothukudi", "Dindigul", "Thanjavur", "Ranipet", "Sivakasi", "Karur", 
    "Udhagamandalam (Ooty)", "Hosur", "Nagercoil", "Kanchipuram", "Kumbakonam", "Karaikudi", 
    "Neyveli", "Cuddalore", "Tiruvannamalai", "Pollachi", "Rajapalayam", "Gudiyatham", "Pudukkottai"
  ],
  "Maharashtra": [
    "Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Kalyan-Dombivli", "Vasai-Virar", 
    "Chhatrapati Sambhaji Nagar (Aurangabad)", "Navi Mumbai", "Solapur", "Mira-Bhayandar", 
    "Bhiwandi", "Amravati", "Nanded", "Kolhapur", "Akola", "Panvel", "Ulhasnagar", "Sangli", 
    "Malegaon", "Jalgaon", "Latur", "Dhule", "Ahmednagar", "Chandrapur", "Parbhani", "Jalna"
  ],
  "Karnataka": [
    "Bengaluru (Bangalore)", "Mysuru (Mysore)", "Hubballi-Dharwad", "Mangaluru (Mangalore)", 
    "Belagavi (Belgaum)", "Davanagere", "Ballari (Bellary)", "Vijayapura (Bijapur)", 
    "Shivamogga (Shimoga)", "Tumakuru (Tumkur)", "Kalaburagi (Gulbarga)", "Raichur", 
    "Bidar", "Hosapete", "Gadag-Betageri", "Udupi", "Robertsonpet (KGF)", "Bhadravati", "Chitradurga", "Kolar", "Mandya", "Hassan"
  ],
  "Kerala": [
    "Thiruvananthapuram", "Kochi (Cochin)", "Kozhikode (Calicut)", "Kollam", "Thrissur", 
    "Alappuzha (Alleppey)", "Palakkad", "Kannur", "Kottayam", "Malappuram", "Kasaragod", 
    "Pathanamthitta", "Idukki", "Wayanad", "Thalassery", "Ponnani", "Vatakara", "Kanhangad"
  ],
  "Telangana": [
    "Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Ramagundam", "Khammam", 
    "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet", "Miryalaguda", "Siddipet", "Jagtial"
  ],
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Kakinada", "Rajahmundry", 
    "Tirupati", "Kadapa", "Anantapur", "Vizianagaram", "Eluru", "Ongole", "Nandyal", "Machilipatnam", "Adoni", "Tenali", "Chittoor", "Hindupur", "Bhimavaram"
  ],
  "Delhi (NCT)": [
    "New Delhi", "Central Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi", 
    "South West Delhi", "North West Delhi", "North East Delhi", "Dwarka", "Rohini", "Connaught Place", "Saket", "Karol Bagh", "Lajpat Nagar", "Janakpuri", "Vasant Kunj"
  ],
  "Gujarat": [
    "Ahmedabad", "Surat", "Vadodara (Baroda)", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", 
    "Gandhinagar", "Anand", "Navsari", "Morbi", "Nadiad", "Surendranagar", "Bharuch", "Mehsana", "Bhuj", "Porbandar", "Palanpur", "Valsad", "Vapi", "Gondal", "Veraval", "Godhra", "Patan"
  ],
  "West Bengal": [
    "Kolkata", "Howrah", "Asansol", "Siliguri", "Durgapur", "Bardhaman", "Malda", 
    "Baharampur", "Habra", "Kharagpur", "Shantipur", "Dankuni", "Dhulian", "Ranaghat", "Haldia", "Raiganj", "Krishnanagar", "Nabadwip", "Medinipur", "Jalpaiguri", "Balurghat", "Basirhat", "Bankura", "Darjeeling"
  ],
  "Rajasthan": [
    "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", 
    "Bharatpur", "Sikar", "Pali", "Sri Ganganagar", "Kishangarh", "Baran", "Dhaulpur", "Tonk", "Beawar", "Hanumangarh", "Chittorgarh", "Gangapur City", "Sawai Madhopur", "Jhunjhunu", "Churu"
  ],
  "Uttar Pradesh": [
    "Lucknow", "Kanpur", "Ghaziabad", "Agra", "Meerut", "Varanasi", "Prayagraj (Allahabad)", 
    "Bareilly", "Aligarh", "Moradabad", "Saharanpur", "Gorakhpur", "Noida", "Firozabad", "Jhansi", "Muzaffarnagar", "Mathura", "Budaun", "Rampur", "Shahjahanpur", "Farrukhabad", "Ayodhya", "Hapur", "Etawah", "Mirzapur", "Bulandshahr"
  ],
  "Punjab": [
    "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali (SAS Nagar)", 
    "Hoshiarpur", "Pathankot", "Moga", "Batala", "Abohar", "Malerkotla", "Khanna", "Phagwara", "Muktsar", "Barnala", "Rajpura", "Firozpur", "Kapurthala", "Sangrur"
  ],
  "Haryana": [
    "Gurugram (Gurgaon)", "Faridabad", "Panipat", "Ambala", "Yamunanagar", "Rohtak", 
    "Hisar", "Karnal", "Sonipat", "Panchkula", "Bhiwani", "Sirsa", "Bahadurgarh", "Jind", "Thanesar", "Kaithal", "Rewari", "Palwal"
  ],
  "Madhya Pradesh": [
    "Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", 
    "Ratlam", "Rewa", "Murwara (Katni)", "Singrauli", "Burhanpur", "Khandwa", "Bhind", "Chhindwara", "Guna", "Shivpuri", "Vidisha", "Damoh", "Mandsaur", "Khargone", "Neemuch", "Pithampur", "Hoshangabad"
  ],
  "Bihar": [
    "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", 
    "Arrah", "Begusarai", "Katihar", "Munger", "Chhapra", "Danapur", "Bettiah", "Saharsa", "Sasaram", "Hajipur", "Dehri", "Siwan", "Motihari", "Nawada", "Bagaha", "Buxar", "Kishanganj", "Sitamarhi"
  ],
  "Odisha": [
    "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", 
    "Bhadrak", "Baripada", "Jharsuguda", "Jeypore", "Bargarh", "Rayagada", "Bolangir"
  ],
  "Assam": [
    "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Dhubri", "Diphu", "North Lakhimpur", "Karimganj", "Sivasagar", "Goalpara"
  ],
  "Chhattisgarh": [
    "Raipur", "Bhilai Nagar", "Bilaspur", "Korba", "Rajnandgaon", "Raigarh", "Jagdalpur", "Ambikapur", "Dhamtari", "Durg", "Mahasamund"
  ],
  "Jharkhand": [
    "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City", "Deoghar", "Phusro", "Hazaribagh", "Giridih", "Ramgarh", "Medininagar", "Chirkunda", "Chaibasa"
  ],
  "Uttarakhand": [
    "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Pithoragarh", "Ramnagar", "Manglaur", "Nainital", "Mussoorie"
  ],
  "Himachal Pradesh": [
    "Shimla", "Dharamshala", "Solan", "Mandi", "Palampur", "Baddi", "Nahan", "Paonta Sahib", "Sundarnagar", "Kullu", "Hamirpur", "Una", "Bilaspur", "Chamba"
  ],
  "Goa": [
    "Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Cuncolim"
  ],
  "Jammu and Kashmir": [
    "Srinagar", "Jammu", "Anantnag", "Baramulla", "Kathua", "Udhampur", "Sopore", "Rajouri", "Poonch", "Kupwara", "Pulwama"
  ],
  "Puducherry": [
    "Puducherry", "Karaikal", "Yanam", "Mahe", "Ozhukarai"
  ],
  "Chandigarh": [
    "Chandigarh", "Sector 17", "Sector 35", "Manimajra", "Industrial Area Phase 1", "Industrial Area Phase 2"
  ],
  "Arunachal Pradesh": [
    "Itanagar", "Naharlagun", "Pasighat", "Tawang", "Ziro", "Bomdila", "Tezu", "Along (Aalo)", "Roing"
  ],
  "Manipur": [
    "Imphal", "Churachandpur", "Thoubal", "Bishnupur", "Ukhrul", "Kakching", "Senapati", "Tamenglong"
  ],
  "Meghalaya": [
    "Shillong", "Tura", "Jowai", "Nongpoh", "Cherrapunji (Sohra)", "Williamnagar", "Baghmara", "Mairang"
  ],
  "Mizoram": [
    "Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib", "Saiha", "Lawngtlai", "Hnahthial"
  ],
  "Nagaland": [
    "Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Mon", "Chumoukedima"
  ],
  "Sikkim": [
    "Gangtok", "Namchi", "Geyzing", "Mangan", "Ravangla", "Jorethang", "Singtam", "Rangpo"
  ],
  "Tripura": [
    "Agartala", "Dharmanagar", "Udaipur", "Kailashahar", "Belonia", "Teliamura", "Khowai", "Melaghar"
  ],
  "Andaman and Nicobar Islands": [
    "Port Blair", "Havelock Island (Swaraj Dweep)", "Diglipur", "Neil Island (Shaheed Dweep)", "Mayabunder", "Rangat"
  ],
  "Dadra and Nagar Haveli and Daman and Diu": [
    "Daman", "Diu", "Silvassa", "Amli", "Bhimpore"
  ],
  "Ladakh": [
    "Leh", "Kargil", "Diskit", "Drass", "Padum"
  ],
  "Lakshadweep": [
    "Kavaratti", "Agatti", "Amini", "Andrott", "Minicoy", "Kalpeni"
  ]
};

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [placed, setPlaced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    alternatePhone: "",
    country: "India",
    state: "Tamil Nadu",
    city: "Chennai",
    customCity: "",
    address1: "",
    address2: "",
    pincode: "",
    notes: ""
  });

  // Automatically display the user's name when logged in
  useEffect(() => {
    if (user) {
      let autoFirst = "";
      let autoLast = "";

      if ((user as any).firstName) {
        autoFirst = (user as any).firstName;
        autoLast = (user as any).lastName || "";
      } else if ((user as any).name) {
        const parts = ((user as any).name || "").trim().split(" ");
        autoFirst = parts[0] || "";
        autoLast = parts.slice(1).join(" ") || "";
      } else {
        const savedUserName = localStorage.getItem("GadgetZone_user_name");
        if (savedUserName) {
          const parts = savedUserName.trim().split(" ");
          autoFirst = parts[0] || "";
          autoLast = parts.slice(1).join(" ") || "";
        } else if (user.email) {
          const cleanUser = user.email.split("@")[0].replace(/[0-9]/g, "");
          const parts = cleanUser.split(/[._-]/).filter(Boolean);
          if (parts.length > 1) {
            autoFirst = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            autoLast = parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
          } else if (parts.length === 1) {
            autoFirst = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
          }
        }
      }

      // Check for previously remembered shipping preferences
      const saved = localStorage.getItem("GadgetZone_shipping_pref");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setForm(prev => ({
            ...prev,
            firstName: prev.firstName || parsed.firstName || autoFirst,
            lastName: prev.lastName || parsed.lastName || autoLast,
            phone: prev.phone || parsed.phone || "",
            alternatePhone: prev.alternatePhone || parsed.alternatePhone || "",
            country: parsed.country || prev.country,
            state: parsed.state || prev.state,
            city: parsed.city || prev.city,
            customCity: parsed.customCity || prev.customCity || "",
            address1: parsed.address1 || prev.address1,
            address2: parsed.address2 || prev.address2,
            pincode: parsed.pincode || prev.pincode
          }));
          return;
        } catch {}
      }

      setForm(prev => ({
        ...prev,
        firstName: prev.firstName || autoFirst,
        lastName: prev.lastName || autoLast
      }));
    }
  }, [user]);

  // Handle Country selection change
  const handleCountryChange = (selectedCountry: string) => {
    if (selectedCountry === "India") {
      setForm(f => ({
        ...f,
        country: selectedCountry,
        state: "Tamil Nadu",
        city: "Chennai",
        customCity: ""
      }));
    } else {
      setForm(f => ({
        ...f,
        country: selectedCountry,
        state: "",
        city: "",
        customCity: ""
      }));
    }
  };

  // Handle State selection change -> dynamically updates city list
  const handleStateChange = (selectedState: string) => {
    const availableCities = INDIAN_CITIES_BY_STATE[selectedState] || [];
    const defaultCity = availableCities.length > 0 ? availableCities[0] : "";
    setForm(f => ({
      ...f,
      state: selectedState,
      city: defaultCity,
      customCity: ""
    }));
  };

  const handleNameChange = (firstName: string, lastName: string) => {
    setForm(f => ({ ...f, firstName, lastName }));
    const combined = `${firstName} ${lastName}`.trim();
    if (combined) {
      try {
        localStorage.setItem("GadgetZone_user_name", combined);
      } catch {}
    }
  };

  const getEffectiveCity = () => {
    if (form.city === "__other__") {
      return form.customCity.trim();
    }
    return form.city.trim();
  };

  const handlePlace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to place an order.");
      navigate("/login?redirect=/checkout");
      return;
    }

    const effectiveCity = getEffectiveCity();

    if (!form.firstName.trim() || !form.phone.trim() || !form.address1.trim() || !form.pincode.trim() || !form.state.trim() || !effectiveCity) {
      toast.error("Please fill in all required contact and shipping address fields.");
      return;
    }

    setLoading(true);
    try {
      const finalPrice = totalPrice;
      const trackingId = `TRK-GZ-${Math.floor(100000 + Math.random() * 900000)}`;
      const selectedPaymentText = "Cash on Delivery (COD)";
      const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

      const formattedAddress = `${form.address1.trim()}${form.address2.trim() ? `, ${form.address2.trim()}` : ""}, ${effectiveCity}, ${form.state}, ${form.country} - ${form.pincode.trim()}`;

      // Save user shipping preference for next checkout
      try {
        localStorage.setItem("GadgetZone_shipping_pref", JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          alternatePhone: form.alternatePhone,
          country: form.country,
          state: form.state,
          city: effectiveCity,
          address1: form.address1,
          address2: form.address2,
          pincode: form.pincode
        }));
      } catch {}

      const orderData = {
        items: items.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        totalPrice: finalPrice,
        shippingInfo: {
          name: fullName,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          alternatePhone: form.alternatePhone,
          address: formattedAddress,
          address1: form.address1,
          address2: form.address2,
          country: form.country,
          state: form.state,
          city: effectiveCity,
          pincode: form.pincode,
          notes: form.notes
        },
        paymentMethod: selectedPaymentText,
        trackingId,
        trackingStage: 1, // Step 1: Order Placed
        courier: "SpeedPost Express",
        estimatedDeliveryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
      };

      try {
        await fetch("/api/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(orderData)
        });
      } catch (err) {
        console.warn("Backend order sync notice:", err);
      }

      // Format structured WhatsApp message to Seller Mobile (+91 9345600128)
      const itemsListText = items.map(i => `• ${i.name} (x${i.quantity}) - ₹${(i.price * i.quantity).toLocaleString()}`).join('\n');
      const waText = `🛒 *NEW ORDER RECEIVED - GADGET ZONE*\n\n🆔 *Tracking ID:* #${trackingId}\n👤 *Customer:* ${fullName}\n📞 *Mobile:* ${form.phone}${form.alternatePhone ? `\n📱 *Alt Mobile:* ${form.alternatePhone}` : ""}\n📍 *Address 1:* ${form.address1}${form.address2 ? `\n📍 *Address 2:* ${form.address2}` : ""}\n🏙️ *City:* ${effectiveCity}\n🗺️ *State:* ${form.state}\n🌍 *Country:* ${form.country}\n📮 *Pincode:* ${form.pincode}\n💳 *Payment Method:* ${selectedPaymentText}\n💰 *Total Amount:* ₹${finalPrice.toLocaleString()}\n\n📦 *Ordered Items:*\n${itemsListText}\n\n📝 *Notes:* ${form.notes || 'None'}`;
      
      const emailBody = `New Order Placed:\n\nTracking ID: #${trackingId}\nCustomer Name: ${fullName}\nPhone: ${form.phone}\nAlternate Phone: ${form.alternatePhone || 'None'}\nAddress 1: ${form.address1}\nAddress 2: ${form.address2 || 'None'}\nCity: ${effectiveCity}\nState: ${form.state}\nCountry: ${form.country}\nPincode: ${form.pincode}\nPayment Method: ${selectedPaymentText}\nTotal Amount: ₹${finalPrice.toLocaleString()}\n\nItems:\n${itemsListText}\n\nNotes:\n${form.notes || 'None'}`;

      const waUrl = `https://wa.me/919345600128?text=${encodeURIComponent(waText)}`;
      const mailtoUrl = `mailto:gadgetzone667@gmail.com?subject=${encodeURIComponent("New Order #" + trackingId)}&body=${encodeURIComponent(emailBody)}`;

      // Open WhatsApp & Mailto to notify seller directly
      window.open(waUrl, "_blank");
      setTimeout(() => {
        window.location.href = mailtoUrl;
      }, 600);

      setOrderDetails({ ...orderData, items: [...items], customerName: fullName, effectiveCity });
      setPlaced(true);
      clearCart();
      toast.success(`Order placed successfully! Tracking ID: ${trackingId}`);
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "An error occurred while placing your order.");
    } finally {
      setLoading(false);
    }
  };

  if (placed) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-center bg-background px-4">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card p-8 sm:p-10 rounded-3xl border border-border shadow-2xl flex flex-col items-center text-center max-w-lg w-full relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/10 via-transparent to-transparent pointer-events-none"></div>
          <div className="bg-emerald-500/20 p-4 rounded-full mb-5 relative border border-emerald-500/30">
             <CheckCircle2 className="h-16 w-16 text-emerald-400" />
          </div>
          <h1 className="font-display text-3xl font-extrabold mb-2">Order Confirmed!</h1>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed relative z-10">
            Thank you, <span className="text-foreground font-bold">{orderDetails?.customerName || form.firstName}</span>! Your order has been placed successfully.
          </p>

          <div className="w-full bg-muted/40 rounded-2xl p-5 mb-6 border border-border text-left space-y-3">
             <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tracking Number</span>
                <span className="font-mono text-xs font-bold text-sky-400">{orderDetails?.trackingId}</span>
             </div>
             <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Payment Method</span>
                <span className="text-xs font-semibold text-foreground">{orderDetails?.paymentMethod}</span>
             </div>
             <div className="flex justify-between items-center pb-2 border-b border-border">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Delivery Destination</span>
                <span className="text-xs font-medium text-foreground truncate max-w-[220px]">
                  {orderDetails?.effectiveCity || form.city}, {form.state}
                </span>
             </div>
             <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Estimated Delivery</span>
                <span className="text-xs font-semibold text-emerald-400">{orderDetails?.estimatedDeliveryDate}</span>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            <Link to="/orders" className="w-full">
              <Button size="lg" className="w-full h-12 font-bold rounded-xl bg-sky-500 text-white shadow-md hover:bg-sky-600">
                <Truck className="h-4 w-4 mr-2" /> Track Order Status
              </Button>
            </Link>
            <Link to="/products" className="w-full">
              <Button size="lg" variant="outline" className="w-full h-12 font-bold rounded-xl border-border">
                <ShoppingBag className="h-4 w-4 mr-2" /> Keep Shopping
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex flex-col items-center justify-center bg-background px-4">
        <div className="bg-muted/30 p-10 rounded-full mb-6 border border-border/50">
          <UserCheck className="h-16 w-16 text-muted-foreground stroke-1" />
        </div>
        <h2 className="font-display text-3xl font-bold mb-3 tracking-tight">Login Required</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-sm">
          Please log in to your account to review your cart and complete checkout.
        </p>
        <Link to="/login?redirect=/checkout">
          <Button size="lg" className="rounded-xl px-8 shadow-md">
            Sign In to Continue
          </Button>
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex flex-col items-center justify-center bg-background px-4">
        <div className="bg-muted/30 p-10 rounded-full mb-6 border border-border/50">
          <Package className="h-16 w-16 text-muted-foreground stroke-1" />
        </div>
        <h2 className="font-display text-3xl font-bold mb-3 tracking-tight">Your Cart is Empty</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-sm">
          You need items in your cart to proceed with checkout. Let's fix that!
        </p>
        <Link to="/products">
          <Button size="lg" className="rounded-xl px-8 shadow-md">
            Browse Hardware
          </Button>
        </Link>
      </div>
    );
  }

  const citiesForCurrentState = form.country === "India" && form.state ? (INDIAN_CITIES_BY_STATE[form.state] || []) : [];

  return (
    <div className="min-h-screen pt-24 pb-16 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link to="/cart" className="inline-flex items-center font-medium text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Cart
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight">Checkout</h1>
            <p className="text-sm text-muted-foreground mt-1">Please provide your contact information and shipping destination.</p>
          </div>
          {user && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-xs font-semibold text-sky-400">
              <UserCheck className="h-4 w-4 text-sky-400" />
              <span>Logged In: {user.email}</span>
            </div>
          )}
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Main Checkout Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-3 space-y-6">
            
            {/* UNIFIED SECTION 1: Contact & Delivery Details */}
            <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b border-border">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</div>
                    Contact & Delivery Details
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1 ml-9.5">
                    Please provide your contact details and shipping address below.
                  </p>
                </div>
                {user && (form.firstName || form.lastName) && (
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 self-start">
                    <UserCheck className="h-3.5 w-3.5" />
                    Auto-filled from account
                  </span>
                )}
              </div>

              <form id="checkout-form" onSubmit={handlePlace} className="space-y-6">
                {/* SUBGROUP 1: Personal Contact */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <UserCheck className="h-3.5 w-3.5 text-sky-400" />
                    <span>Contact Information</span>
                  </div>

                  {/* First Name & Last Name in Order */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="firstName" className="text-muted-foreground text-xs font-semibold">
                          First Name <span className="text-destructive">*</span>
                        </Label>
                        <span className="text-[11px] text-muted-foreground/70 font-normal">e.g. Vijay</span>
                      </div>
                      <Input 
                        id="firstName" 
                        required 
                        value={form.firstName} 
                        onChange={e => handleNameChange(e.target.value, form.lastName)} 
                        placeholder="e.g. Vijay" 
                        className="h-11 bg-muted/30 rounded-xl border-border focus-visible:ring-primary/20 text-sm" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="lastName" className="text-muted-foreground text-xs font-semibold">
                          Last Name <span className="text-muted-foreground/60 font-normal">(Optional)</span>
                        </Label>
                        <span className="text-[11px] text-muted-foreground/70 font-normal">e.g. Kumar</span>
                      </div>
                      <Input 
                        id="lastName" 
                        value={form.lastName} 
                        onChange={e => handleNameChange(form.firstName, e.target.value)} 
                        placeholder="e.g. Kumar" 
                        className="h-11 bg-muted/30 rounded-xl border-border focus-visible:ring-primary/20 text-sm" 
                      />
                    </div>
                  </div>

                  {/* Phone & Alternate Phone Number in Order */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="phone" className="text-muted-foreground text-xs font-semibold">
                          Phone Number <span className="text-destructive">*</span>
                        </Label>
                        <span className="text-[11px] text-muted-foreground/70 font-normal">e.g. +91 93456 00128</span>
                      </div>
                      <Input 
                        id="phone" 
                        required 
                        type="tel" 
                        value={form.phone} 
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} 
                        placeholder="e.g. +91 93456 00128" 
                        className="h-11 bg-muted/30 rounded-xl border-border focus-visible:ring-primary/20 text-sm" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="alternatePhone" className="text-muted-foreground text-xs font-semibold">
                          Alternate Phone Number <span className="text-muted-foreground/60 font-normal">(Optional)</span>
                        </Label>
                        <span className="text-[11px] text-muted-foreground/70 font-normal">e.g. +91 98765 43210</span>
                      </div>
                      <Input 
                        id="alternatePhone" 
                        type="tel" 
                        value={form.alternatePhone} 
                        onChange={e => setForm(f => ({ ...f, alternatePhone: e.target.value }))} 
                        placeholder="e.g. +91 98765 43210 (Optional)" 
                        className="h-11 bg-muted/30 rounded-xl border-border focus-visible:ring-primary/20 text-sm" 
                      />
                    </div>
                  </div>
                </div>

                {/* Subtle Divider */}
                <div className="pt-2 border-t border-border/80"></div>

                {/* SUBGROUP 2: Delivery & Shipping Address */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 text-sky-400" />
                    <span>Delivery Address</span>
                  </div>

                  {/* Row 1: Country & State */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Country Selector with example placeholder */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="country" className="text-muted-foreground text-xs font-semibold flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-sky-400" />
                          Country <span className="text-destructive">*</span>
                        </Label>
                        <span className="text-[11px] text-muted-foreground/70 font-normal">e.g. India</span>
                      </div>
                      <select
                        id="country"
                        required
                        value={form.country}
                        onChange={e => handleCountryChange(e.target.value)}
                        className="w-full h-11 px-3.5 bg-muted/30 rounded-xl border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                      >
                        <option value="" disabled>Select Country (e.g. India)</option>
                        {COUNTRIES.map(c => (
                          <option key={c} value={c} className="bg-card text-foreground">
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* State Selector with example placeholder */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="state" className="text-muted-foreground text-xs font-semibold flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-sky-400" />
                          State <span className="text-destructive">*</span>
                        </Label>
                        <span className="text-[11px] text-muted-foreground/70 font-normal">e.g. Tamil Nadu</span>
                      </div>
                      {form.country === "India" ? (
                        <select
                          id="state"
                          required
                          value={form.state}
                          onChange={e => handleStateChange(e.target.value)}
                          className="w-full h-11 px-3.5 bg-muted/30 rounded-xl border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        >
                          <option value="" disabled>Select State (e.g. Tamil Nadu / Maharashtra)</option>
                          {INDIAN_STATES.map(s => (
                            <option key={s} value={s} className="bg-card text-foreground">
                              {s}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          id="state"
                          required
                          value={form.state}
                          onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                          placeholder="e.g. California / Ontario / Dubai"
                          className="h-11 bg-muted/30 rounded-xl border-border focus-visible:ring-primary/20 text-sm"
                        />
                      )}
                    </div>
                  </div>

                  {/* Row 2: City / District & Pincode in Order */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* City Selector with example placeholder */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="city" className="text-muted-foreground text-xs font-semibold flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-sky-400" />
                          City / District <span className="text-destructive">*</span>
                        </Label>
                        <span className="text-[11px] text-muted-foreground/70 font-normal">e.g. Chennai</span>
                      </div>
                      {form.country === "India" && citiesForCurrentState.length > 0 ? (
                        <select
                          id="city"
                          required
                          value={form.city}
                          onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                          className="w-full h-11 px-3.5 bg-muted/30 rounded-xl border border-border text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        >
                          <option value="" disabled>Select City / District (e.g. Chennai / Coimbatore)</option>
                          {citiesForCurrentState.map(city => (
                            <option key={city} value={city} className="bg-card text-foreground">
                              {city}
                            </option>
                          ))}
                          <option value="__other__" className="bg-card text-sky-400 font-semibold">
                            + Other City (Type Manually)
                          </option>
                        </select>
                      ) : (
                        <Input
                          id="city"
                          required
                          value={form.city}
                          onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                          placeholder="e.g. Chennai / Mumbai / Bengaluru"
                          className="h-11 bg-muted/30 rounded-xl border-border focus-visible:ring-primary/20 text-sm"
                        />
                      )}

                      {/* Custom City Input when '__other__' is selected */}
                      {form.city === "__other__" && (
                        <div className="pt-2">
                          <Input
                            required
                            value={form.customCity}
                            onChange={e => setForm(f => ({ ...f, customCity: e.target.value }))}
                            placeholder="e.g. Enter your specific town or city (e.g. Tambaram / Maduranthakam)"
                            className="h-11 bg-muted/30 rounded-xl border-sky-500/40 focus-visible:ring-primary/20 text-sm"
                          />
                        </div>
                      )}
                    </div>

                    {/* Pincode with example placeholder */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="pincode" className="text-muted-foreground text-xs font-semibold">
                          Pincode / Postal Code <span className="text-destructive">*</span>
                        </Label>
                        <span className="text-[11px] text-muted-foreground/70 font-normal">e.g. 600107</span>
                      </div>
                      <Input 
                        id="pincode" 
                        required 
                        value={form.pincode} 
                        onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} 
                        placeholder="e.g. 600107" 
                        className="h-11 bg-muted/30 rounded-xl border-border focus-visible:ring-primary/20 text-sm" 
                      />
                    </div>
                  </div>

                  {/* Address Line 1 */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="address1" className="text-muted-foreground text-xs font-semibold">
                        Address Line 1 (Flat / House No, Building, Street) <span className="text-destructive">*</span>
                      </Label>
                      <span className="text-[11px] text-muted-foreground/70 font-normal">e.g. Flat 4B, Emerald Heights</span>
                    </div>
                    <Input 
                      id="address1" 
                      required 
                      value={form.address1} 
                      onChange={e => setForm(f => ({ ...f, address1: e.target.value }))} 
                      placeholder="e.g. No. 5, 1st Street, Jayaram Nagar, Nerkundram" 
                      className="h-11 bg-muted/30 rounded-xl border-border focus-visible:ring-primary/20 text-sm" 
                    />
                  </div>

                  {/* Address Line 2 */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="address2" className="text-muted-foreground text-xs font-semibold">
                        Address Line 2 (Apartment, Suite, Area, Landmark) <span className="text-muted-foreground/60 font-normal">(Optional)</span>
                      </Label>
                      <span className="text-[11px] text-muted-foreground/70 font-normal">e.g. Near Metro Station</span>
                    </div>
                    <Input 
                      id="address2" 
                      value={form.address2} 
                      onChange={e => setForm(f => ({ ...f, address2: e.target.value }))} 
                      placeholder="e.g. Near Metro Station / Opp. Tech Hub (Optional)" 
                      className="h-11 bg-muted/30 rounded-xl border-border focus-visible:ring-primary/20 text-sm" 
                    />
                  </div>
                  
                  {/* Order Notes */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="notes" className="text-muted-foreground text-xs font-semibold">
                        Order Notes & Special Instructions <span className="text-muted-foreground/60 font-normal">(Optional)</span>
                      </Label>
                      <span className="text-[11px] text-muted-foreground/70 font-normal">e.g. Deliver after 5 PM</span>
                    </div>
                    <Textarea 
                      id="notes" 
                      value={form.notes} 
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} 
                      placeholder="e.g. Please deliver after 5:00 PM, or leave package with building security" 
                      className="min-h-[70px] bg-muted/30 rounded-xl border-border focus-visible:ring-primary/20 text-sm" 
                    />
                  </div>
                </div>
              </form>
            </div>
            
            {/* SECTION 2: Payment Method */}
            <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-sm">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</div>
                Payment Method
              </h2>
              
              <div className="p-4 rounded-2xl border-2 border-sky-500 bg-sky-500/10 shadow-[0_0_12px_rgba(56,189,248,0.2)] transition-all">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="h-5 w-5 text-sky-400" />
                    <h3 className="font-bold text-sm text-foreground">Cash on Delivery (COD)</h3>
                  </div>
                  <div className="w-4 h-4 rounded-full border border-sky-500 bg-sky-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                  Pay with cash or UPI directly when your hardware is securely delivered to your door.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Order Summary Sidebar */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
            <div className="bg-card rounded-2xl border border-border p-6 sm:p-8 shadow-sm sticky top-28">
              <h2 className="text-lg font-bold mb-5">Order Summary</h2>
              
              <div className="space-y-3.5 max-h-[280px] overflow-y-auto pr-2 mb-5">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3.5 items-center">
                    <div className="w-12 h-12 rounded-xl bg-muted/40 p-1.5 flex items-center justify-center border border-border shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs truncate">{item.name}</h4>
                      <p className="text-[11px] text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-xs font-bold text-sky-400">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="space-y-2.5 pt-5 border-t border-border text-xs">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Subtotal ({items.length} items)</span>
                  <span className="font-medium text-foreground">₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Shipping</span>
                  <span className="font-medium text-emerald-400">FREE</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Payment</span>
                  <span className="font-semibold text-sky-400">Cash on Delivery</span>
                </div>
              </div>
              
              <div className="mt-5 pt-5 border-t border-border flex justify-between items-center">
                <span className="text-base font-bold">Total</span>
                <span className="font-display text-2xl font-black text-primary">
                  ₹{totalPrice.toLocaleString()}
                </span>
              </div>
              
              <div className="mt-6">
                <Button 
                  type="submit" 
                  form="checkout-form" 
                  size="lg" 
                  className="w-full h-12 text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white rounded-xl"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing Order...
                    </>
                  ) : "Confirm & Place Order"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
