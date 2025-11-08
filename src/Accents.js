//______________________________________________//
import AvatarMenu from "./components/AvatarMenu";
//_____________________________________________//


export default function Speak(model){
    let Accent = "British";
    if(model == "Aifra"){
        Accent = "Naigerian";
    }


     return Accent;

    
}