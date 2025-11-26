import Layout from "../components/Layout";
import { EnvelopeIcon, PhoneIcon, MapPinIcon, UsersIcon } from '@heroicons/react/24/outline';

const teamInfo = {
  teamName: "智慧穿衣團隊",
  description: "長庚大學資管系畢業專題",
  team: [
    { name: "雷庭瑞", id: "B1144205" },
    { name: "潘昱文", id: "B1144217" },
    { name: "陳徽婷", id: "B1144219" },
    { name: "陳亭妤", id: "B1144108" },
    { name: "徐玉涵", id: "B1144137" },
  ],
  email: "smartclothes2025@gmail.com",
  address: "桃園市龜山區文化一路259號",
};

export default function Contact() {
  return (
    <Layout title="聯絡我們">
      <div className="page-wrapper">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 md:p-10">
            <div className="text-center">
              <UsersIcon className="w-12 h-10 mx-auto text-indigo-500" />
              <h1 className="text-3xl font-bold text-slate-900 mt-4">
                {teamInfo.teamName}
              </h1>
              <p className="text-slate-600 mt-3 text-base leading-relaxed">
                {teamInfo.description}
              </p>
              <div className="text-sm text-slate-600 mt-2">
                {teamInfo.team.map((m) => (
                  <div key={m.id} className="leading-tight">{m.name} ({m.id})</div>
                ))}
              </div>
            </div>

            <div className="my-8 border-t border-slate-200"></div>
            <div className="space-y-7">

              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                  <EnvelopeIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <a
                    href={`mailto:${teamInfo.email}`}
                    className="text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    {teamInfo.email}
                  </a>
                </div>

              </div>

              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                  <MapPinIcon className="w-5 h-5 text-indigo-600" />
                </div>

                <p className="text-slate-600">{teamInfo.address}</p>

              </div>
            </div>
          </div>
        </div>
      </div>

    </Layout>
  );
}
