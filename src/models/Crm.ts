import { Phone, User, Address } from './User';

export interface Personal {
    mobilePhone?: Phone;
}

export interface Company {
    name?: string;
}

export interface Professional {
    workdPhone?: Phone;
    jobTitle?: string;
    company?: Company;
}

export interface Lead extends User {
    personal?: Personal;
    professional?: Professional;
    address?: Address;
}

export interface Account extends Lead {
}

export interface Person extends Account {
}