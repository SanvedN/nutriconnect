import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, BarChart, PieChart } from '@/components/ui/chart'

// Mock data for the charts
const weeklyNutritionData = [
  { name: 'Mon', calories: 2100, protein: 100, carbs: 250, fat: 70 },
  { name: 'Tue', calories: 2200, protein: 110, carbs: 260, fat: 75 },
  { name: 'Wed', calories: 2000, protein: 95, carbs: 240, fat: 65 },
  { name: 'Thu', calories: 2150, protein: 105, carbs: 255, fat: 72 },
  { name: 'Fri', calories: 2300, protein: 115, carbs: 270, fat: 78 },
  { name: 'Sat', calories: 2400, protein: 120, carbs: 280, fat: 80 },
  { name: 'Sun', calories: 2250, protein: 108, carbs: 265, fat: 76 },
]

const macroNutrientData = [
  { name: 'Protein', value: 25 },
  { name: 'Carbs', value: 55 },
  { name: 'Fat', value: 20 },
]

const microNutrientData = [
  { name: 'Vitamin A', value: 15 },
  { name: 'Vitamin C', value: 20 },
  { name: 'Vitamin D', value: 10 },
  { name: 'Iron', value: 15 },
  { name: 'Calcium', value: 20 },
  { name: 'Potassium', value: 20 },
]

export default function NutritionGraphs() {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="macronutrients">Macronutrients</TabsTrigger>
        <TabsTrigger value="micronutrients">Micronutrients</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Calorie Intake</CardTitle>
              <CardDescription>Your calorie consumption over the past week</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <LineChart
                data={weeklyNutritionData}
                index="name"
                categories={['calories']}
                colors={['green']}
                yAxisWidth={40}
                className="h-72"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Macronutrient Distribution</CardTitle>
              <CardDescription>Average distribution of your macronutrients</CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <PieChart
                data={macroNutrientData}
                index="name"
                category="value"
                colors={['sky', 'violet', 'yellow']}
                className="h-72"
              />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="macronutrients">
        <Card>
          <CardHeader>
            <CardTitle>Macronutrient Breakdown</CardTitle>
            <CardDescription>Detailed view of your macronutrient intake over the week</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <BarChart
              data={weeklyNutritionData}
              index="name"
              categories={['protein', 'carbs', 'fat']}
              colors={['sky', 'violet', 'yellow']}
              yAxisWidth={40}
              className="h-80"
            />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="micronutrients">
        <Card>
          <CardHeader>
            <CardTitle>Micronutrient Distribution</CardTitle>
            <CardDescription>Overview of essential vitamins and minerals in your diet</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <PieChart
              data={microNutrientData}
              index="name"
              category="value"
              colors={['sky', 'violet', 'yellow', 'green', 'red', 'orange']}
              className="h-80"
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}