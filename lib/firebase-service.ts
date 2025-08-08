import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  limit,
} from "firebase/firestore"
import { db } from "./firebase"
import type { Customer, Memo, MemoItem } from "@/types"

export const customerService = {
  
  async getByMobile(mobile: string): Promise<Customer | null> {
    const q = query(
      collection(db, "customers"),
      where("mobile", ">=", mobile),
      where("mobile", "<=", mobile + "\uf8ff"),
      limit(1)
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) return null

    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() } as Customer
  },

  async getManyByMobile(mobile: string): Promise<Customer[]> {
    const q = query(
      collection(db, "customers"),
      where("mobile", ">=", mobile),
      where("mobile", "<=", mobile + "\uf8ff")
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) return []

    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Customer))
  },

  async create(customer: Omit<Customer, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, "customers"), {
      ...customer,
      createdAt: Timestamp.fromDate(customer.createdAt),
    })
    return docRef.id
  },

  async update(id: string, customer: Partial<Customer>): Promise<void> {
    await updateDoc(doc(db, "customers", id), customer)
  },
}

export const memoService = {
  async saveItems(items: MemoItem[]): Promise<void> {
    const tasks = items.map(async (item) => {
      const q = query(
        collection(db, "items"),
        where("name", "==", item.itemName)
      )
      const snapshot = await getDocs(q)
      if (snapshot.empty) {
        await addDoc(collection(db, "items"), {
          name: item.itemName,
          rate: item.rate,
          unit: item.unit
        })
      } else {
        const docRef = doc(db, "items", snapshot.docs[0].id)
        await updateDoc(docRef, {
          rate: item.rate,
          unit: item.unit
        })
      }
    })
    await Promise.all(tasks)
  },

  async getItemsByName(itemName: string): Promise<MemoItem[]> {
    const q = query(
      collection(db, "items"),
      where("name", ">=", itemName),
      where("name", "<=", itemName + "\uf8ff")
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      itemName: doc.data().name,
      // quantity: 0, // Default value, can be adjusted
      unit: doc.data().unit,
      rate: doc.data().rate,
      // amount: 0, // Default value, can be adjusted
    })) as MemoItem[]
  },

  async create(memo: Omit<Memo, "id">): Promise<string> {
    const docRef = await addDoc(collection(db, "memos"), {
      ...memo,
      date: Timestamp.fromDate(memo.date),
      createdAt: Timestamp.fromDate(memo.createdAt),
    })
    return docRef.id
  },

  async getByCustomer(customerId: string, startDate?: Date, endDate?: Date): Promise<Memo[]> {
    let q = query(collection(db, "memos"), where("customerId", "==", customerId), orderBy("date", "desc"))

    if (startDate && endDate) {
      // To include 1 day before startDate and the entire endDate, adjust the range
      const prevDay = new Date(startDate)
      prevDay.setDate(prevDay.getDate() - 1)
      const nextDay = new Date(endDate)
      nextDay.setDate(nextDay.getDate() + 1)
      q = query(
      collection(db, "memos"),
      where("customerId", "==", customerId),
      where("date", ">=", Timestamp.fromDate(prevDay)),
      where("date", "<", Timestamp.fromDate(nextDay)),
      orderBy("date", "desc"),
      )
    }

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
    })) as Memo[]
  },

  async getById(id: string): Promise<Memo | null> {
    const docRef = doc(db, "memos", id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) return null

    const data = docSnap.data()
    return {
      id: docSnap.id,
      ...data,
      date: data.date.toDate(),
      createdAt: data.createdAt.toDate(),
    } as Memo
  },

  async getByDateRange(startDate: Date, endDate: Date): Promise<Memo[]> {
    const prevDay = new Date(startDate)
    prevDay.setDate(prevDay.getDate() - 1)
    const nextDay = new Date(endDate)
    nextDay.setDate(nextDay.getDate() + 1)
    const q = query(
      collection(db, "memos"),
      where("date", ">=", Timestamp.fromDate(prevDay)),
      where("date", "<", Timestamp.fromDate(nextDay)),
      orderBy("date", "desc"),
    )

    const snapshot = await getDocs(q)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate(),
    })) as Memo[]
  },
}
