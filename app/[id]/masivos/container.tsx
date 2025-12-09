"use client"

import { useState } from "react";
import CategoriesComponent from "./components/categories/categoriesComponent";
import IniciarSessionComponent from "./components/iniciarSession/iniciarSesion";
import Clientes from "./components/clientes/createEdit/clientes";
import ConfigurationComponent from "./components/configuration/configurationComponent";
import TemplatesGallery from "./components/templatesgallery/TemplatesGallery";
import CampaignManager from "./components/campaingmanager/CampaignManager";

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
                <div className="flex justify-between ">
                    <ConfigurationComponent id={id!} />
                    <CategoriesComponent id={id!} />
                    <Clientes id={id!} />
                </div>
                <div>
                    {/* <TemplatesGallery userId={id!} /> */}
                    <CampaignManager userId={id!} />
                </div>
            </div>
        );
    }

}