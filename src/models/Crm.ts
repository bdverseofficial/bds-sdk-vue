import { Phone, User, Address } from './User';
import { Reference } from './Reference';
import { BdsEntity, UserEvent } from '..';

export interface Personal {
    mobilePhone?: Phone;
    birthDate?: Date;
    homePhone?: Phone;
    webSite?: string;
}

export interface Company {
    name?: string;
}

export interface Professional {
    workdPhone?: Phone;
    jobTitle?: string;
    company?: Reference;
    department?: string;
    companyName?: string;
}

export interface Communication {
}

export interface Individual {
    personal?: Personal;
    professional?: Professional;
    communication?: Communication;
}

export interface Lead extends User {
    isPerson?: boolean;
    individual?: Individual;
    address?: Address;
    companyName?: string;
    description?: string;
}

export interface Account extends Lead {
}

export interface Person extends Account {
}

export interface Case extends BdsEntity {
    description?: string;
    subject?: string;
    account?: Reference;
    relatedTo?: Reference;
    origin?: string;
    reference?: string;
    closed?: UserEvent;
    reason?: string;
    status?: string;
    caseType?: string;
}