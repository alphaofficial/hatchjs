export class Example {
    id: string;
    name: string;
    createdAt: Date = new Date();
    updatedAt: Date = new Date();

    constructor(id: string, name: string) {
        this.id = id;
        this.name = name;
    }
}