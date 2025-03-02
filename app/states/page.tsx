"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import Image from "next/image";  // Import Image component
import { ScrollAnimation } from "@/components/GlobalScrollAnimation";


// Define TypeScript types for state data
type StateData = {
  state: string;
  llcFee: number;
  discFee: string | number;
  annualReportFee: string | number;
};

// Dummy data for illustration
const stateData: StateData[] = [
  { state: 'Montana LLC', llcFee: 35, discFee: '-', annualReportFee: '20 (10th April)' },
  { state: 'New Mexico LLC', llcFee: 50, discFee: '40', annualReportFee: '-' },
  { state: 'Utah LLC', llcFee: 59, discFee: '-', annualReportFee: '18 (360 Days)' },
  { state: 'California LLC', llcFee: 70, discFee: '-', annualReportFee: '820 (360 Days)' },
  { state: 'Delaware LLC', llcFee: 90, discFee: '-', annualReportFee: '300 (20th May)' },
  { state: 'Georgia LLC', llcFee: 100, discFee: '-', annualReportFee: '50 (25th March)' },
  { state: 'Wyoming LLC', llcFee: 100, discFee: '80', annualReportFee: '60 (360 Days)' },
  { state: 'Idaho LLC', llcFee: 100, discFee: '-', annualReportFee: '0 (however, an information report must be filed after 360Days)' },
  { state: 'Virginia LLC', llcFee: 100, discFee: '-', annualReportFee: '50 (360 Days)' },
  { state: 'Florida LLC', llcFee: 125, discFee: '-', annualReportFee: '138.75 (1st May)' },
  { state: 'Illinois LLC', llcFee: 150, discFee: '-', annualReportFee: '75 (360 Days)' },
  { state: 'New York LLC', llcFee: 200, discFee: '-', annualReportFee: '9 (720 Days)' },
  { state: 'Washington LLC', llcFee: 200, discFee: '-', annualReportFee: '60 (360 Days)' },
  { state: 'Texas LLC', llcFee: 300, discFee: '-', annualReportFee: '0 (however a Public Information Report must be filed by 10th May)' },
  { state: 'Nevada LLC', llcFee: 425, discFee: '-', annualReportFee: '350 (360 Days)' },
  { state: 'Oregon LLC', llcFee: 100, discFee: '-', annualReportFee: '100 (360 Days)' },
  { state: 'Alabama LLC', llcFee: 230, discFee: '-', annualReportFee: '50 (10th April)' },
  { state: 'Alaska LLC', llcFee: 250, discFee: '-', annualReportFee: '100 (every 2 years on 2 jan)' },
  { state: 'Arizona LLC', llcFee: 50, discFee: '-', annualReportFee: '-' },
  { state: 'Arkansas LLC', llcFee: 45, discFee: '-', annualReportFee: '150 (1st May)' },
  { state: 'Colorado LLC', llcFee: 50, discFee: '-', annualReportFee: '10 (360 Day)' },
  { state: 'Connecticut LLC', llcFee: 120, discFee: '-', annualReportFee: '80 (31th March)' },
  { state: 'Hawaii LLC', llcFee: 50, discFee: '-', annualReportFee: '15 (360 Days)' },
  { state: 'Indiana LLC', llcFee: 95, discFee: '-', annualReportFee: '31 (720 Days)' },
  { state: 'Iowa LLC', llcFee: 50, discFee: '-', annualReportFee: '30 (every 2 years on 1 April)' },
  { state: 'Kansas LLC', llcFee: 160, discFee: '-', annualReportFee: '50 (15th April)' },
  { state: 'Kentucky LLC', llcFee: 40, discFee: '-', annualReportFee: '15 (30 june)' },
  { state: 'Louisiana LLC', llcFee: 100, discFee: '-', annualReportFee: '35 (360 Days)' },
  { state: 'Maryland LLC', llcFee: 100, discFee: '-', annualReportFee: '300 (10th April)' },
  { state: 'Massachusetts LLC', llcFee: 500, discFee: '-', annualReportFee: '500 (360 Days)' },
  { state: 'Michigan LLC', llcFee: 50, discFee: '-', annualReportFee: '25 (10th Feb)' },
  { state: 'Minnesota LLC', llcFee: 155, discFee: '-', annualReportFee: '0 (however, an information report must be filed on 20th December)' },
  { state: 'Mississippi LLC', llcFee: 50, discFee: '-', annualReportFee: '0 (however, an information report must be filed on 10th April)' },
  { state: 'Missouri LLC', llcFee: 50, discFee: '-', annualReportFee: '-' },
  { state: 'New Hampshire LLC', llcFee: 102, discFee: '-', annualReportFee: '100 (1st April)' },
  { state: 'New Jersey LLC', llcFee: 125, discFee: '-', annualReportFee: '75 (360 Days)' },
  { state: 'North Carolina LLC', llcFee: 125, discFee: '-', annualReportFee: '200 (10th April)' },
  { state: 'North Dakota LLC', llcFee: 135, discFee: '-', annualReportFee: '50 (10th Nov)' },
  // ... add more states here
];

export default function StatesPage() {
  const [sortColumn, setSortColumn] = useState<keyof StateData | "">("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const sortedData = [...stateData].sort((a, b) => {
    if (sortColumn) {
      if (a[sortColumn] < b[sortColumn]) return sortDirection === "asc" ? -1 : 1;
      if (a[sortColumn] > b[sortColumn]) return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  const filteredData = sortedData.filter((item) =>
    item.state.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSort = (column: keyof StateData) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  return (
    <ScrollAnimation>
    <div className="flex justify-center">
      {/* Left Sticky Image */}
      <div className="sticky top-0 h-screen w-[500px] hidden lg:block mr-6">
      <Image
    src="/left.webp"
    alt="left Image"
    layout="fill"
    objectFit="cover"
    objectPosition="center right"   // Center the image properly
    className="w-full h-full"
  />
      </div>

      {/* Main Content (Table + Search) */}
      <div className="container mx-auto px-4 py-8 mt-10 mb-48">
        <h1
          className="text-4xl font-bold mb-8 text-center"
          style={{ fontFamily: "Montserrat, sans-serif", fontSize: "40px" }}
        >
          LLC Filing Fees by State
        </h1>
        <div className="mb-4 flex justify-center">
        <Input
  type="text"
  placeholder="Search by state..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="max-w-lg text-black focus:border-[#22c984] focus:ring-0 focus:outline-none shadow-2xl"
/>


        </div>
        <div className="overflow-x-auto flex justify-center ">
          <div className="max-w-[1050px] w-full">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">
                    <Button variant="ghost" onClick={() => handleSort("state")}>
                      State
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-2 text-left">
                    <Button variant="ghost" onClick={() => handleSort("llcFee")}>
                      LLC Filing Fee
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-2 text-left">
                    <Button variant="ghost" onClick={() => handleSort("discFee")}>
                      Disc. Fee
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  <th className="p-2 text-left">
                    <Button variant="ghost" onClick={() => handleSort("annualReportFee")}>
                      Annual Report Fee
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                </tr>
              </thead>
              <tbody>
  {filteredData.map((item, index) => (
    <tr
      key={index}
      className={`${
        index % 2 === 0 ? "bg-white" : "bg-gray-50"
      } transition duration-200 ease-in-out hover:bg-gray-100 hover:shadow-md transform-gpu hover:-translate-y-2 hover:scale-[1.01]`}
    >
      <td className="p-2 border-t transition-colors">{item.state}</td>
      <td className="p-2 border-t transition-colors">${item.llcFee}</td>
      <td className="p-2 border-t transition-colors">
        {item.discFee === '-' ? '-' : `$${item.discFee}`}
      </td>
      <td className="p-2 border-t transition-colors">
        {item.annualReportFee === '-' ? '-' : `$${item.annualReportFee}`}
      </td>
    </tr>
  ))}
</tbody>


            </table>
          </div>
        </div>
      </div>

      {/* Right Sticky Image */}
      <div className="sticky top-0 h-screen w-[500px] hidden lg:block object-cover ml-6 ">
      <Image
    src="/right.webp"
    alt="Right Image"
    layout="fill"
    objectFit="cover"
    objectPosition="center left"   // Center the image properly
    className="w-full h-full"
  />
      </div>
    </div>
    </ScrollAnimation>

  );
}
