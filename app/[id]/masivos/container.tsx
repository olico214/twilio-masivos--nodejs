"use client"

import { useState } from "react";
import CategoriesComponent from "./components/categories/categoriesComponent";
import IniciarSessionComponent from "./components/iniciarSession/iniciarSesion";
import Clientes from "./components/clientes/createEdit/clientes";
import ConfigurationComponent from "./components/configuration/configurationComponent";
import TemplatesGallery from "./components/templatesgallery/TemplatesGallery";
import CampaignManager from "./components/campaingmanager/CampaignManager";
import TwilioTemplatesManager from "./components/campaingmanager/TwilioTemplatesManager";

export default function MasivosContainer({ id }: { id?: string }) {
    const [validateSession, setValidateSession] = useState(false);
    if (validateSession === false) {
        return (
            <div className="mx-auto flex flex-col items-center justify-center min-h-screen p-4">
                <IniciarSessionComponent id={id} setValidateSession={setValidateSession} />
            </div>
        )
    } else {

        return (
            <div className="p-4">
                <div className="grid grid-cols-4 gap-4 ">
                    <ConfigurationComponent id={id!} />
                    <CategoriesComponent id={id!} />
                    <Clientes id={id!} />
                    <TwilioTemplatesManager userId={id!} />
                </div>
                <div className="mt-8">
                    {/* <TemplatesGallery userId={id!} /> */}
                    <CampaignManager userId={id!} />
                </div>
            </div>
        );
    }

}